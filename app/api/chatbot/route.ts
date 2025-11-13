import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { getCurrentUser } from '@/lib/auth-server'
import { connectToDatabase } from '@/server/lib/mongodb'
import { User } from '@/server/models/User'
import { UserProfile } from '@/server/models/UserProfile'
import { Job, JobApplication, Opportunity } from '@/server/models/Job'
import { Product, Order } from '@/server/models/Product'
import { normalizeSkills, calculateMatchScore, normalizeSkillRequirements } from '@/lib/skills'

// Central Luzon provinces and cities
const CENTRAL_LUZON_PROVINCES = [
  'Aurora', 'Bataan', 'Bulacan', 'Nueva Ecija', 
  'Pampanga', 'Tarlac', 'Zambales', 'Olongapo',
  'Angeles', 'San Fernando', 'Malolos', 'Cabanatuan',
  'Tarlac City', 'Baliuag', 'Meycauayan', 'San Jose',
  'Mabalacat', 'San Fernando City', 'Bacolor', 'Apalit',
  'Guagua', 'Floridablanca', 'Porac', 'Lubao'
]

// Helper to check if location is in Central Luzon
function isCentralLuzon(location?: string): boolean {
  if (!location) return false
  const loc = location.toLowerCase()
  return CENTRAL_LUZON_PROVINCES.some(province => 
    loc.includes(province.toLowerCase())
  )
}

// Get user analytics for personalized recommendations
async function getUserAnalytics(userId: string) {
  try {
    await connectToDatabase()
    
    const user = await User.findById(userId).lean()
    const profile = await UserProfile.findOne({ user_id: userId }).lean()
    const workerSkills = normalizeSkills(profile?.skills as any)
    
    // Focus on Central Luzon jobs
    const centralLuzonFilter = {
      status: 'active',
      $or: CENTRAL_LUZON_PROVINCES.map(province => ({
        location: new RegExp(province, 'i')
      }))
    }
    
    // Get job applications
    const applications = await JobApplication.find({ worker_id: userId })
      .populate('opportunity_id', 'title location pay_rate status')
      .sort({ created_at: -1 })
      .limit(10)
      .lean()
    
    // Get marketplace activity
    const [ordersAsBuyer, ordersAsSeller, products] = await Promise.all([
      Order.find({ buyer_id: userId })
        .populate('product_id', 'title price category')
        .sort({ created_at: -1 })
        .limit(10)
        .lean(),
      Order.find({ seller_id: userId })
        .populate('product_id', 'title price category')
        .sort({ created_at: -1 })
        .limit(10)
        .lean(),
      Product.find({ seller_id: userId })
        .sort({ created_at: -1 })
        .limit(10)
        .lean()
    ])
    
    // Get recommended jobs - prioritize Central Luzon
    const allJobs = await Opportunity.find(centralLuzonFilter)
      .populate('recruiter_id', 'full_name')
      .sort({ created_at: -1 })
      .limit(50)
      .lean()
    
    const recommendedJobs = allJobs.map((job: any) => {
      const jobSkills = normalizeSkillRequirements(job.required_skills as any)
      const match = calculateMatchScore(jobSkills, workerSkills)
      const isUserLocation = isCentralLuzon(user?.location) && 
                            isCentralLuzon(job.location)
      
      return {
        id: String(job._id),
        title: job.title,
        company: job.company_name || 'Unknown',
        location: job.location,
        pay_rate: job.pay_rate,
        pay_type: job.pay_type,
        match_score: match.score,
        skills_required: jobSkills.map((s: any) => s.name),
        proximity_bonus: isUserLocation ? 10 : 0,
      }
    })
    .map((job: any) => ({
      ...job,
      final_score: job.match_score + job.proximity_bonus
    }))
    .filter((job: any) => job.final_score > 40)
    .sort((a: any, b: any) => b.final_score - a.final_score)
    .slice(0, 5)
    
    return {
      user: {
        name: user?.full_name,
        role: user?.role,
        location: user?.location,
        is_central_luzon: isCentralLuzon(user?.location),
        skills: workerSkills.map((s: any) => `${s.name} (Level ${s.level})`),
      },
      applications: applications.map((app: any) => ({
        job_title: app.opportunity_id?.title || 'Unknown',
        status: app.status,
        match_score: app.match_score || 0,
      })),
      marketplace: {
        products_selling: products.length,
        total_orders_as_buyer: ordersAsBuyer.length,
        total_orders_as_seller: ordersAsSeller.length,
        recent_products: products.slice(0, 5).map((p: any) => ({
          title: p.title,
          price: p.price,
          category: p.category,
        })),
      },
      recommended_jobs: recommendedJobs,
    }
  } catch (error) {
    console.error('Error getting user analytics:', error)
    return null
  }
}

// Get Central Luzon regional analytics
async function getCentralLuzonAnalytics() {
  try {
    await connectToDatabase()
    
    // Central Luzon location filter
    const centralLuzonFilter = {
      $or: CENTRAL_LUZON_PROVINCES.map(province => ({
        location: new RegExp(province, 'i')
      }))
    }
    
    // Regional job trends
    const [jobsByProvince, productsByCategory, skillDemand] = await Promise.all([
      // Jobs by province in Central Luzon
      Opportunity.aggregate([
        { $match: { status: 'active', ...centralLuzonFilter } },
        { $group: { 
          _id: '$location', 
          count: { $sum: 1 }, 
          avgPay: { $avg: '$pay_rate' },
          totalApplications: { $sum: '$applications_count' }
        }},
        { $sort: { count: -1 } },
        { $limit: 7 }
      ]),
      // Products by category in Central Luzon
      Product.aggregate([
        { $match: { status: 'active', ...centralLuzonFilter } },
        { $group: { 
          _id: '$category', 
          count: { $sum: 1 }, 
          avgPrice: { $avg: '$price' },
          totalSold: { $sum: { $ifNull: ['$quantity_available', 0] } }
        }},
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      // Most in-demand skills
      Opportunity.aggregate([
        { $match: { status: 'active', ...centralLuzonFilter } },
        { $unwind: { path: '$required_skills', preserveNullAndEmptyArrays: true } },
        { $group: {
          _id: { $ifNull: ['$required_skills.name', '$required_skills'] },
          demand: { $sum: 1 },
          avgPay: { $avg: '$pay_rate' }
        }},
        { $sort: { demand: -1 } },
        { $limit: 10 }
      ])
    ])
    
    return {
      regional_trends: {
        province_job_market: jobsByProvince.map((item: any) => ({
          province: item._id,
          job_count: item.count,
          avg_pay: Math.round(item.avgPay || 0),
          competition: item.totalApplications || 0
        })),
        in_demand_skills: skillDemand.map((item: any) => ({
          skill: item._id || 'Unknown',
          demand: item.demand,
          avg_pay: Math.round(item.avgPay || 0)
        })),
        popular_categories: productsByCategory.map((item: any) => ({
          category: item._id,
          listings: item.count,
          avg_price: Math.round(item.avgPrice || 0),
          total_available: item.totalSold
        })),
      }
    }
  } catch (error) {
    console.error('Error getting Central Luzon analytics:', error)
    return null
  }
}

export async function POST(req: Request) {
  try {
    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set')
      return new Response(
        JSON.stringify({ error: 'OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables.' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Try to get user, but don't fail if not authenticated (optional auth for chatbot)
    let user = null
    try {
      user = await getCurrentUser()
    } catch (authError) {
      console.warn('Auth check failed (continuing anyway):', authError)
      // Continue without auth - chatbot can work for unauthenticated users
    }

    const body = await req.json()
    const { messages } = body

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: messages array is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Processing chatbot request with', messages.length, 'messages')

    // Gather analytics data if user is authenticated
    let userAnalytics = null
    let regionalAnalytics = null
    
    if (user) {
      try {
        userAnalytics = await getUserAnalytics(user.id)
        regionalAnalytics = await getCentralLuzonAnalytics()
      } catch (error) {
        console.error('Error gathering analytics:', error)
        // Continue without analytics if there's an error
      }
    }

    // Build enhanced system prompt with Philippines/Central Luzon focus
    let systemPrompt = `You are an AI-powered agricultural assistant for AgriReach, focused on the Philippines, particularly Region III (Central Luzon).

**Your Geographic Focus:**
- Primary: Central Luzon (Aurora, Bataan, Bulacan, Nueva Ecija, Pampanga, Tarlac, Zambales)
- Context: Philippine agricultural practices, crops, and farming methods
- Regional knowledge: Rice farming in Nueva Ecija, vegetable farming in Pampanga, aquaculture in Central Luzon, etc.

**Your Capabilities:**

1. **Job Matching for Central Luzon:**
   - Recommend jobs in Central Luzon based on user skills and location
   - Explain match scores and why certain jobs fit
   - Suggest skill improvements for better opportunities
   - Consider proximity - prioritize jobs in user's province

2. **Marketplace Insights (Philippines):**
   - Provide pricing insights for agricultural products in Central Luzon
   - Analyze popular product categories (rice, vegetables, fruits, livestock)
   - Suggest optimal pricing based on regional market trends
   - Identify seasonal demand patterns (e.g., rice harvest season, vegetable peak seasons)

3. **Regional Labor Trends:**
   - Identify skill gaps in Central Luzon agricultural sector
   - Highlight in-demand skills by province
   - Discuss wage trends across provinces
   - Explain productivity opportunities

4. **Application Insights:**
   - Analyze user's application history
   - Suggest profile improvements
   - Explain regional competition levels
   - Recommend best times to apply

**Philippine Agricultural Context:**
- Common crops: Rice (palay), corn, vegetables (pechay, kangkong, ampalaya), fruits (mango, banana)
- Livestock: Pigs (baboy), chickens (manok), carabao, goats (kambing)
- Aquaculture: Tilapia, bangus, shrimps
- Farming seasons: Wet season (June-Nov), Dry season (Dec-May)
- Regional specialties: Nueva Ecija (rice), Pampanga (sugar, vegetables), Tarlac (corn, vegetables)`

    // Add user-specific context if available
    if (userAnalytics) {
      systemPrompt += `\n\n**Current User Profile:**
- Name: ${userAnalytics.user.name}
- Role: ${userAnalytics.user.role}
- Location: ${userAnalytics.user.location} ${userAnalytics.user.is_central_luzon ? '(Central Luzon)' : ''}
- Skills: ${userAnalytics.user.skills.join(', ') || 'None listed'}

**Application History:** ${userAnalytics.applications.length} applications
${userAnalytics.applications.length > 0 ? userAnalytics.applications.map((app: any) => `- ${app.job_title}: ${app.status} (Match: ${app.match_score}%)`).join('\n') : 'No applications yet'}

**Marketplace Activity:**
- Products Selling: ${userAnalytics.marketplace.products_selling}
- Orders as Buyer: ${userAnalytics.marketplace.total_orders_as_buyer}
- Orders as Seller: ${userAnalytics.marketplace.total_orders_as_seller}
${userAnalytics.marketplace.recent_products.length > 0 ? `- Recent Products: ${userAnalytics.marketplace.recent_products.map((p: any) => `${p.title} (₱${p.price})`).join(', ')}` : ''}

**Recommended Jobs in Central Luzon (Top 5):**
${userAnalytics.recommended_jobs.length > 0 ? userAnalytics.recommended_jobs.map((job: any) => `- ${job.title} at ${job.company} (${job.location}) - Match: ${job.final_score}% - Pay: ₱${job.pay_rate}/${job.pay_type || 'day'}`).join('\n') : 'No matching jobs found. Consider updating your skills.'}`
    }

    // Add regional trends if available
    if (regionalAnalytics && regionalAnalytics.regional_trends) {
      systemPrompt += `\n\n**Central Luzon Regional Trends:**

**Job Market by Province:**
${regionalAnalytics.regional_trends.province_job_market.length > 0 ? regionalAnalytics.regional_trends.province_job_market.map((prov: any) => `- ${prov.province}: ${prov.job_count} active jobs, Avg Pay: ₱${prov.avg_pay}, Applications: ${prov.competition}`).join('\n') : 'No data available'}

**Most In-Demand Skills:**
${regionalAnalytics.regional_trends.in_demand_skills.length > 0 ? regionalAnalytics.regional_trends.in_demand_skills.map((skill: any) => `- ${skill.skill}: ${skill.demand} job openings, Avg Pay: ₱${skill.avg_pay}`).join('\n') : 'No data available'}

**Popular Product Categories:**
${regionalAnalytics.regional_trends.popular_categories.length > 0 ? regionalAnalytics.regional_trends.popular_categories.map((cat: any) => `- ${cat.category}: ${cat.listings} listings, Avg Price: ₱${cat.avg_price}, Total Available: ${cat.total_available}`).join('\n') : 'No data available'}`
    }

    systemPrompt += `\n\n**Response Guidelines:**
- Always reference Philippine pesos (₱) for prices
- Use Filipino agricultural terms when appropriate (e.g., "palay" for rice, "baboy" for pig)
- Consider seasonal patterns in Central Luzon
- Provide actionable, region-specific advice
- When discussing locations, mention specific provinces/cities in Central Luzon
- Reference local agricultural practices and crops
- Be friendly, culturally aware, and provide data-driven insights specific to Central Luzon's agricultural sector.`

    const result = await streamText({
      model: openai('gpt-4o-mini'),
      maxTokens: 500, // Increased for more detailed responses
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...messages,
      ],
    } as any)

    console.log('Stream text result created successfully')
    console.log('Available methods on result:', Object.keys(result))
    
    // Manual streaming implementation for AI SDK v5
    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Try different streaming methods
          const textStream = (result as any).textStream
          const fullStream = (result as any).fullStream
          
          if (textStream && typeof textStream === 'function') {
            // Use textStream() method
            for await (const chunk of textStream()) {
              const data = `0:${JSON.stringify({ type: 'text-delta', textDelta: chunk })}\n`
              controller.enqueue(encoder.encode(data))
            }
          } else if (fullStream && typeof fullStream === 'function') {
            // Use fullStream() method
            for await (const chunk of fullStream()) {
              if (chunk.type === 'text-delta') {
                const data = `0:${JSON.stringify({ type: 'text-delta', textDelta: chunk.textDelta })}\n`
                controller.enqueue(encoder.encode(data))
              }
            }
          } else {
            // Fallback: stream the text word by word
            const text = await (result as any).text
            const words = text.split(' ')
            for (let i = 0; i < words.length; i++) {
              const chunk = (i === 0 ? '' : ' ') + words[i]
              const data = `0:${JSON.stringify({ type: 'text-delta', textDelta: chunk })}\n`
              controller.enqueue(encoder.encode(data))
              // Small delay for streaming effect
              await new Promise(resolve => setTimeout(resolve, 20))
            }
          }
          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chatbot error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    })
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const errorDetails = error instanceof Error && error.stack ? error.stack.split('\n')[0] : ''
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process chat request',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

