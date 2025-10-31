"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useRef } from "react";
import {
  BookOpen,
  Clock,
  Award,
  CheckCircle2,
  Circle,
  PlayCircle,
  FileText,
  Download,
  Share2,
  ChevronRight,
  Trophy,
  Star,
  X,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import Trans from "@/components/ui/Trans";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Type definitions
type LessonType = "video" | "reading" | "quiz";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface Lesson {
  id: number;
  title: string;
  duration: string;
  type: LessonType;
  completed: boolean;
  description: string;
  videoUrl?: string;
  content?: string;
  questions?: Question[];
}

// Sample course data with video URLs
const COURSES = {
  "intro-agritech": {
    title: "Introduction to Modern Agritech",
    description:
      "Master the fundamentals of agricultural technology and digital farming practices. This comprehensive course covers modern tools, techniques, and best practices for smallholder farmers.",
    duration: "2 hours",
    level: "Beginner" as const,
    rating: 4.8,
    enrolled: 1250,
    progress: 35,
    lessons: [
      {
        id: 1,
        title: "What is Agritech?",
        duration: "5 mins",
        type: "video" as const,
        completed: false,
        description: "Understanding the digital transformation in agriculture",
        videoUrl: "https://www.youtube.com/watch?v=5y6iu4-xdFc",
      },
      {
        id: 2,
        title: "Benefits of Digital Farming",
        duration: "3 mins",
        type: "video" as const,
        completed: false,
        description: "How technology improves yields and reduces costs",
        videoUrl: "https://www.youtube.com/watch?v=NiyTDzv1OEo",
      },
      {
        id: 3,
        title: "Essential Tools and Apps",
        duration: "9 mins",
        type: "video" as const,
        completed: false,
        description: "Mobile applications every farmer should know",
        videoUrl: "https://www.youtube.com/watch?v=waK0p5AuBto",
      },
      {
        id: 4,
        title: "Reading: Agritech Case Studies",
        duration: "10 mins",
        type: "reading" as const,
        completed: false,
        description: "Real-world success stories from Filipino farmers",
        content: `
          <h3>Success Stories: Digital Transformation in Philippine Agriculture</h3>
          
          <h4>Case Study 1: Smart Rice Farming in Nueva Ecija</h4>
          <p>Farmer Juan Dela Cruz increased his rice yield by 30% using precision agriculture tools. By adopting mobile apps for crop monitoring and weather forecasting, he reduced water consumption by 25% while improving overall productivity.</p>
          
          <h4>Case Study 2: Vegetable Farm Management in Benguet</h4>
          <p>Maria Santos transformed her family's vegetable farm using digital record-keeping and market access platforms. She now connects directly with buyers through AgriReach marketplace, eliminating middlemen and increasing profits by 40%.</p>
          
          <h4>Case Study 3: Livestock Monitoring in Mindanao</h4>
          <p>Pedro Garcia implemented IoT sensors for his livestock operation, reducing disease outbreaks by 50% through early detection. Mobile health tracking helped him maintain better records and improve breeding programs.</p>
          
          <h4>Key Takeaways:</h4>
          <ul>
            <li>Digital tools reduce input costs by 15-30%</li>
            <li>Mobile apps improve market access and fair pricing</li>
            <li>Data-driven decisions lead to better yields</li>
            <li>Technology adoption doesn't require large investments</li>
          </ul>
        `,
      },
      {
        id: 5,
        title: "Quiz: Agritech Basics",
        duration: "8 mins",
        type: "quiz" as const,
        completed: false,
        description: "Test your understanding of core concepts",
        questions: [
          {
            id: 1,
            question:
              "What is the primary benefit of using precision agriculture tools?",
            options: [
              "They make farming more complicated",
              "They help optimize resource use and increase yields",
              "They completely replace human farmers",
              "They only work for large-scale farms",
            ],
            correctAnswer: 1,
            explanation:
              "Precision agriculture tools help farmers optimize resource use (water, fertilizer, etc.) and increase yields through data-driven decisions.",
          },
          {
            id: 2,
            question:
              "According to the case studies, digital tools can reduce input costs by:",
            options: ["5-10%", "15-30%", "40-50%", "60-70%"],
            correctAnswer: 1,
            explanation:
              "The case studies showed that digital tools can reduce input costs by 15-30%, making farming more profitable.",
          },
          {
            id: 3,
            question:
              "What was the main advantage Maria Santos gained from using the AgriReach marketplace?",
            options: [
              "Free delivery services",
              "Government subsidies",
              "Direct connection with buyers, eliminating middlemen",
              "Automated farming equipment",
            ],
            correctAnswer: 2,
            explanation:
              "Maria Santos connected directly with buyers through AgriReach marketplace, eliminating middlemen and increasing her profits by 40%.",
          },
          {
            id: 4,
            question:
              "How much did Juan Dela Cruz reduce water consumption using mobile apps?",
            options: ["15%", "25%", "35%", "45%"],
            correctAnswer: 1,
            explanation:
              "Juan Dela Cruz reduced water consumption by 25% while improving overall productivity through crop monitoring and weather forecasting apps.",
          },
          {
            id: 5,
            question:
              "Which technology did Pedro Garcia use for livestock monitoring?",
            options: [
              "Drones",
              "Satellite imaging",
              "IoT sensors",
              "Manual record books",
            ],
            correctAnswer: 2,
            explanation:
              "Pedro Garcia implemented IoT sensors for his livestock operation, reducing disease outbreaks by 50% through early detection.",
          },
          {
            id: 6,
            question:
              "What is a key takeaway about technology adoption in agriculture?",
            options: [
              "It requires large investments",
              "It's only for tech-savvy farmers",
              "It doesn't require large investments",
              "It's too complicated for smallholder farmers",
            ],
            correctAnswer: 2,
            explanation:
              "One of the key takeaways is that technology adoption doesn't require large investments, making it accessible to smallholder farmers.",
          },
        ],
      },
      {
        id: 6,
        title: "Getting Started with Your Farm",
        duration: "39 mins",
        type: "video" as const,
        completed: false,
        description: "Step-by-step implementation guide",
        videoUrl: "https://www.youtube.com/watch?v=RPjEszQGnes",
      },
    ] as Lesson[],
    skills: [
      "Digital Literacy",
      "Farm Management",
      "Technology Adoption",
      "Data Analysis",
    ],
    certificate: true,
  },
  "safe-pesticide": {
    title: "Safe Pesticide Use & Application",
    description:
      "Learn proper handling, application techniques, and safety protocols for pesticide use in agriculture.",
    duration: "1.5 hours",
    level: "Beginner" as const,
    rating: 4.9,
    enrolled: 890,
    progress: 0,
    lessons: [
      {
        id: 1,
        title: "Introduction to Pesticide Safety",
        duration: "24 mins",
        type: "video" as const,
        completed: false,
        description: "Why safety matters in pesticide handling",
        videoUrl: "https://www.youtube.com/watch?v=ncbyTwyGIAE",
      },
      {
        id: 2,
        title: "Types of Pesticides",
        duration: "3 mins",
        type: "video" as const,
        completed: false,
        description: "Understanding different pesticide categories",
        videoUrl: "https://www.youtube.com/watch?v=tkVps0PuSDc",
      },
      {
        id: 3,
        title: "Personal Protective Equipment (PPE)",
        duration: "5 min",
        type: "video" as const,
        completed: false,
        description: "Essential gear and proper usage",
        videoUrl: "https://www.youtube.com/watch?v=uY6hAm93ssk",
      },
      {
        id: 4,
        title: "Application Techniques",
        duration: "27 mins",
        type: "video" as const,
        completed: false,
        description: "Best practices for effective and safe application",
        videoUrl: "https://www.youtube.com/watch?v=_FRVhEQXmZA",
      },
      {
        id: 5,
        title: "Reading: Health Guidelines",
        duration: "8 min",
        type: "reading" as const,
        completed: false,
        description: "WHO and local health standards",
        content: `
          <h3>Pesticide Safety: Health Guidelines and Best Practices</h3>
          
          <h4>WHO Guidelines for Pesticide Use</h4>
          <p>The World Health Organization emphasizes that proper pesticide handling is crucial for farmer health and environmental protection. Studies show that following safety protocols reduces health risks by up to 80%.</p>
          
          <h4>Philippine Regulatory Standards</h4>
          <p>The Fertilizer and Pesticide Authority (FPA) of the Philippines mandates strict compliance with safety standards. All pesticide applications must follow label instructions, use appropriate PPE, and maintain buffer zones near water sources and residential areas.</p>
          
          <h4>Key Health Risks</h4>
          <ul>
            <li><strong>Acute Exposure:</strong> Skin irritation, respiratory problems, nausea, and dizziness</li>
            <li><strong>Chronic Exposure:</strong> Long-term health effects including respiratory diseases and nervous system damage</li>
            <li><strong>Environmental Impact:</strong> Water contamination, soil degradation, and harm to beneficial insects</li>
          </ul>
          
          <h4>Safety Best Practices</h4>
          <p><strong>Before Application:</strong></p>
          <ul>
            <li>Read and understand product labels completely</li>
            <li>Check weather conditions - avoid windy or rainy days</li>
            <li>Inspect all equipment for leaks or damage</li>
            <li>Ensure proper PPE is available and in good condition</li>
          </ul>
          
          <p><strong>During Application:</strong></p>
          <ul>
            <li>Wear complete PPE: gloves, mask, goggles, protective clothing</li>
            <li>Mix chemicals in well-ventilated areas</li>
            <li>Never eat, drink, or smoke while handling pesticides</li>
            <li>Keep bystanders and animals away from application area</li>
          </ul>
          
          <p><strong>After Application:</strong></p>
          <ul>
            <li>Wash hands and exposed skin thoroughly with soap</li>
            <li>Clean equipment properly and store safely</li>
            <li>Dispose of containers according to regulations</li>
            <li>Post warning signs in treated areas</li>
          </ul>
          
          <h4>Emergency Response</h4>
          <p>In case of pesticide exposure:</p>
          <ul>
            <li>Remove contaminated clothing immediately</li>
            <li>Rinse affected area with clean water for at least 15 minutes</li>
            <li>Seek medical attention and bring the product label</li>
            <li>Call emergency hotline: PGH Poison Control - (02) 8554-8400</li>
          </ul>
        `,
      },
      {
        id: 6,
        title: "Final Assessment",
        duration: "10 min",
        type: "quiz" as const,
        completed: false,
        description: "Demonstrate your knowledge",
        questions: [
          {
            id: 1,
            question:
              "According to WHO guidelines, following safety protocols can reduce health risks by up to:",
            options: ["40%", "60%", "80%", "95%"],
            correctAnswer: 2,
            explanation:
              "WHO studies show that proper pesticide handling and following safety protocols can reduce health risks by up to 80%.",
          },
          {
            id: 2,
            question: "What should you do FIRST before applying pesticides?",
            options: [
              "Mix the chemicals",
              "Wear your PPE",
              "Read and understand product labels",
              "Check the weather",
            ],
            correctAnswer: 2,
            explanation:
              "Reading and understanding product labels completely is the first critical step before any pesticide application to ensure proper usage and safety.",
          },
          {
            id: 3,
            question:
              "Which of the following is NOT recommended during pesticide application?",
            options: [
              "Wearing protective gloves",
              "Mixing chemicals in well-ventilated areas",
              "Eating or drinking",
              "Keeping bystanders away",
            ],
            correctAnswer: 2,
            explanation:
              "You should never eat, drink, or smoke while handling pesticides as this can lead to accidental ingestion and serious health risks.",
          },
          {
            id: 4,
            question:
              "What is the minimum time you should rinse your skin if exposed to pesticides?",
            options: ["5 minutes", "10 minutes", "15 minutes", "20 minutes"],
            correctAnswer: 2,
            explanation:
              "If exposed to pesticides, you should rinse the affected area with clean water for at least 15 minutes to remove all chemical residue.",
          },
          {
            id: 5,
            question:
              "Which government agency in the Philippines mandates pesticide safety standards?",
            options: [
              "Department of Agriculture (DA)",
              "Department of Health (DOH)",
              "Fertilizer and Pesticide Authority (FPA)",
              "Environmental Management Bureau (EMB)",
            ],
            correctAnswer: 2,
            explanation:
              "The Fertilizer and Pesticide Authority (FPA) is the government agency that mandates strict compliance with pesticide safety standards in the Philippines.",
          },
          {
            id: 6,
            question:
              "What should you do after completing pesticide application?",
            options: [
              "Store equipment without cleaning",
              "Remove PPE and wash hands immediately",
              "Wash hands and clean equipment properly",
              "Just remove gloves and continue working",
            ],
            correctAnswer: 2,
            explanation:
              "After application, you must wash hands and exposed skin thoroughly, clean equipment properly, and store everything safely to prevent contamination.",
          },
          {
            id: 7,
            question: "When is it NOT safe to apply pesticides?",
            options: [
              "Early morning",
              "On windy or rainy days",
              "Late afternoon",
              "On cloudy days",
            ],
            correctAnswer: 1,
            explanation:
              "Pesticides should never be applied on windy or rainy days as this can cause drift to non-target areas and reduce effectiveness.",
          },
          {
            id: 8,
            question:
              "What is a chronic health effect of long-term pesticide exposure?",
            options: [
              "Skin irritation",
              "Nausea",
              "Respiratory diseases and nervous system damage",
              "Dizziness",
            ],
            correctAnswer: 2,
            explanation:
              "Chronic (long-term) exposure to pesticides can lead to serious health effects including respiratory diseases and nervous system damage.",
          },
        ],
      },
    ] as Lesson[],
    skills: [
      "Safety Protocols",
      "PPE Usage",
      "Application Techniques",
      "Health Awareness",
    ],
    certificate: true,
  },

  "advanced-crop-planning": {
    title: "Advanced Crop Planning & Rotation",
    description:
      "Master seasonal planning, crop rotation strategies, and yield optimization techniques for sustainable farming.",
    duration: "3 hours",
    level: "Intermediate" as const,
    rating: 4.7,
    enrolled: 680,
    progress: 0,
    lessons: [
      {
        id: 1,
        title: "Introduction to Crop Planning",
        duration: "55 mins",
        type: "video" as const,
        completed: false,
        description:
          "Understanding the fundamentals of strategic crop planning",
        videoUrl: "https://www.youtube.com/watch?v=szn_Nz-bPeE",
      },
      {
        id: 2,
        title: "Crop Rotation Principles",
        duration: "8 mins",
        type: "video" as const,
        completed: false,
        description: "Benefits and methods of crop rotation",
        videoUrl: "https://www.youtube.com/watch?v=XeNA6XdMoF8",
      },
      {
        id: 3,
        title: "Seasonal Planning Strategies",
        duration: "21 mins",
        type: "video" as const,
        completed: false,
        description: "Planning your crops around seasons and weather patterns",
        videoUrl: "https://www.youtube.com/watch?v=OEvenZHeA0c",
      },
      {
        id: 4,
        title: "Reading: Successful Rotation Systems",
        duration: "12 mins",
        type: "reading" as const,
        completed: false,
        description: "Real-world examples of effective crop rotation",
        content: `
          <h3>Successful Crop Rotation Systems in Philippine Agriculture</h3>
          
          <h4>What is Crop Rotation?</h4>
          <p>Crop rotation is the practice of growing different types of crops in the same area across sequential seasons. This method helps maintain soil health, reduce pest and disease pressure, and optimize yields.</p>
          
          <h4>Benefits of Crop Rotation</h4>
          <ul>
            <li><strong>Soil Health:</strong> Different crops contribute various nutrients and organic matter</li>
            <li><strong>Pest Control:</strong> Breaks pest and disease cycles naturally</li>
            <li><strong>Improved Yields:</strong> Can increase productivity by 20-30%</li>
            <li><strong>Reduced Chemical Use:</strong> Less dependency on fertilizers and pesticides</li>
          </ul>
          
          <h4>Rice-Vegetable Rotation (Luzon)</h4>
          <p>Farmer Roberto Santos in Nueva Ecija implements a rice-vegetable rotation system. After harvesting rice, he plants mung beans or vegetables during the dry season. This system improved his soil organic matter by <strong>15%</strong> and increased overall farm income by <strong>35%</strong>.</p>
          
          <h4>Corn-Legume Rotation (Mindanao)</h4>
          <p>In Bukidnon, farmer Elena Cruz rotates corn with peanuts and soybeans. The legumes fix nitrogen in the soil, reducing fertilizer costs by <strong>40%</strong>. Her corn yields increased by <strong>25%</strong> after implementing this rotation.</p>
          
          <h4>Multi-Crop Rotation (Visayas)</h4>
          <p>Farmer Jose Manalo in Iloilo practices a 4-season rotation: rice → onions → tomatoes → eggplant. This diverse rotation improved soil structure, reduced pest problems by <strong>60%</strong>, and provided year-round income.</p>
          
          <h4>Key Planning Principles</h4>
          <ul>
            <li>Rotate between different plant families</li>
            <li>Include nitrogen-fixing crops (legumes)</li>
            <li>Consider market demand and prices</li>
            <li>Plan for off-season income sources</li>
            <li>Monitor soil health regularly</li>
          </ul>
        `,
      },
      {
        id: 5,
        title: "Yield Optimization Techniques",
        duration: "1 hour",
        type: "video" as const,
        completed: false,
        description: "Methods to maximize crop productivity",
        videoUrl: "https://www.youtube.com/watch?v=diwsTt_YXa0",
      },
      {
        id: 6,
        title: "Assessment: Crop Planning Mastery",
        duration: "12 mins",
        type: "quiz" as const,
        completed: false,
        description: "Test your crop planning knowledge",
        questions: [
          {
            id: 1,
            question: "What is the primary benefit of crop rotation?",
            options: [
              "It makes farming more complicated",
              "It maintains soil health and reduces pest pressure",
              "It requires more expensive equipment",
              "It only works for large farms",
            ],
            correctAnswer: 1,
            explanation:
              "Crop rotation maintains soil health by varying nutrient demands and naturally breaks pest and disease cycles, leading to healthier crops.",
          },
          {
            id: 2,
            question:
              "According to the case studies, crop rotation can increase yields by:",
            options: ["5-10%", "20-30%", "50-60%", "70-80%"],
            correctAnswer: 1,
            explanation:
              "Studies show that proper crop rotation can increase productivity by 20-30% through improved soil health and reduced pest pressure.",
          },
          {
            id: 3,
            question: "Why are legumes important in crop rotation?",
            options: [
              "They require less water",
              "They fix nitrogen in the soil",
              "They grow faster than other crops",
              "They don't need fertilizer",
            ],
            correctAnswer: 1,
            explanation:
              "Legumes have nitrogen-fixing bacteria in their roots that convert atmospheric nitrogen into a form plants can use, naturally enriching the soil.",
          },
          {
            id: 4,
            question:
              "How much did Elena Cruz reduce fertilizer costs through corn-legume rotation?",
            options: ["20%", "30%", "40%", "50%"],
            correctAnswer: 2,
            explanation:
              "By rotating corn with peanuts and soybeans, Elena reduced fertilizer costs by 40% due to the nitrogen-fixing properties of legumes.",
          },
          {
            id: 5,
            question: "What should you consider when planning crop rotation?",
            options: [
              "Only soil type",
              "Only market prices",
              "Plant families, market demand, and soil health",
              "Only weather patterns",
            ],
            correctAnswer: 2,
            explanation:
              "Successful crop rotation planning requires considering multiple factors: rotating between plant families, market demand, soil health monitoring, and seasonal timing.",
          },
          {
            id: 6,
            question:
              "How much did Jose Manalo reduce pest problems with multi-crop rotation?",
            options: ["30%", "45%", "60%", "75%"],
            correctAnswer: 2,
            explanation:
              "Jose Manalo's diverse 4-season rotation reduced pest problems by 60% by breaking pest life cycles through crop diversity.",
          },
        ],
      },
    ] as Lesson[],
    skills: [
      "Crop Rotation",
      "Seasonal Planning",
      "Yield Optimization",
      "Soil Management",
    ],
    certificate: true,
  },

  "soil-health": {
    title: "Soil Health Management",
    description:
      "Understanding soil composition, pH balance, and nutrient management for optimal yields.",
    duration: "2.5 hours",
    level: "Intermediate" as const,
    rating: 4.6,
    enrolled: 540,
    progress: 0,
    lessons: [
      {
        id: 1,
        title: "Understanding Soil Composition",
        duration: "5 mins",
        type: "video" as const,
        completed: false,
        description: "Learn about soil types and structure",
        videoUrl: "https://www.youtube.com/watch?v=rDgM-FJYe_c", 
      },
      {
        id: 2,
        title: "pH Balance and Testing",
        duration: "7 mins",
        type: "video" as const,
        completed: false,
        description: "How to test and adjust soil pH",
        videoUrl: "https://www.youtube.com/watch?v=mZgxUqoJMcg",
      },
      {
        id: 3,
        title: "Nutrient Management",
        duration: "1 hour and 30 mins",
        type: "video" as const,
        completed: false,
        description: "Essential nutrients and their role in plant growth",
        videoUrl: "https://www.youtube.com/watch?v=KKq8ct89ND8",
      },
      {
        id: 4,
        title: "Reading: Soil Health Best Practices",
        duration: "10 mins",
        type: "reading" as const,
        completed: false,
        description: "Proven methods for maintaining healthy soil",
        content: `
          <h3>Soil Health Management: Best Practices for Filipino Farmers</h3>
          
          <h4>Understanding Soil Health</h4>
          <p>Healthy soil is the foundation of successful farming. It provides nutrients, water, and support for plants while hosting billions of beneficial microorganisms. Proper soil management can increase yields by 30-40% while reducing input costs.</p>
          
          <h4>Soil Composition Basics</h4>
          <p>Ideal soil consists of:</p>
          <ul>
            <li><strong>45% Minerals:</strong> Sand, silt, and clay particles</li>
            <li><strong>25% Air:</strong> Essential for root respiration</li>
            <li><strong>25% Water:</strong> Dissolved nutrients and moisture</li>
            <li><strong>5% Organic Matter:</strong> Decomposed plant and animal material</li>
          </ul>
          
          <h4>Case Study: pH Management in Benguet</h4>
          <p>Farmer Anna Valdez noticed poor vegetable growth despite adequate watering and fertilization. Soil testing revealed acidic pH of 5.2. After applying agricultural lime and raising pH to 6.5, her vegetable yields increased by <strong>45%</strong> and crop quality improved significantly.</p>
          
          <h4>Organic Matter Success in Laguna</h4>
          <p>Rice farmer Miguel Santos started composting rice straw instead of burning it. After three years of adding compost, his soil organic matter increased from 2% to 4.5%. This improvement led to:</p>
          <ul>
            <li>30% reduction in fertilizer use</li>
            <li>Better water retention during dry periods</li>
            <li>25% increase in rice yields</li>
            <li>Improved soil structure and workability</li>
          </ul>
          
          <h4>Nutrient Management in Mindanao</h4>
          <p>Corn farmer Teresa Lopez implemented balanced fertilization based on soil tests. Instead of using only urea, she applied NPK fertilizer according to soil deficiencies. Results:</p>
          <ul>
            <li>Corn yields increased by 35%</li>
            <li>Fertilizer costs decreased by 20%</li>
            <li>Plants showed better disease resistance</li>
          </ul>
          
          <h4>Key Soil Health Practices</h4>
          <ul>
            <li><strong>Test Regularly:</strong> Conduct soil tests every 2-3 years</li>
            <li><strong>Add Organic Matter:</strong> Compost, manure, or cover crops</li>
            <li><strong>Maintain pH:</strong> Keep pH between 6.0-7.0 for most crops</li>
            <li><strong>Prevent Erosion:</strong> Use contour plowing and cover crops</li>
            <li><strong>Minimize Tillage:</strong> Preserve soil structure</li>
            <li><strong>Crop Rotation:</strong> Vary nutrient demands</li>
          </ul>
          
          <h4>Warning Signs of Poor Soil Health</h4>
          <ul>
            <li>Stunted plant growth</li>
            <li>Yellow or pale leaves (chlorosis)</li>
            <li>Poor water infiltration</li>
            <li>Soil compaction or crusting</li>
            <li>Reduced yields despite fertilization</li>
          </ul>
        `,
      },
      {
        id: 5,
        title: "Organic Matter and Composting",
        duration: "8 mins",
        type: "video" as const,
        completed: false,
        description: "Building soil health naturally",
        videoUrl: "https://www.youtube.com/watch?v=msLikvjeijM",
      },
      {
        id: 6,
        title: "Final Assessment",
        duration: "10 mins",
        type: "quiz" as const,
        completed: false,
        description: "Demonstrate your soil health knowledge",
        questions: [
          {
            id: 1,
            question:
              "What percentage of organic matter should ideal soil contain?",
            options: ["2%", "5%", "10%", "15%"],
            correctAnswer: 1,
            explanation:
              "Ideal soil contains approximately 5% organic matter, which provides nutrients and improves soil structure.",
          },
          {
            id: 2,
            question: "What is the optimal pH range for most crops?",
            options: ["4.0-5.0", "5.5-6.0", "6.0-7.0", "7.5-8.5"],
            correctAnswer: 2,
            explanation:
              "Most crops grow best in slightly acidic to neutral soil with pH between 6.0-7.0, which allows optimal nutrient availability.",
          },
          {
            id: 3,
            question:
              "How much did Anna Valdez increase yields by correcting soil pH?",
            options: ["25%", "35%", "45%", "55%"],
            correctAnswer: 2,
            explanation:
              "By raising soil pH from 5.2 to 6.5 using agricultural lime, Anna increased her vegetable yields by 45%.",
          },
          {
            id: 4,
            question:
              "What did Miguel Santos do instead of burning rice straw?",
            options: [
              "Sold it to other farmers",
              "Composted it and added it back to soil",
              "Fed it to livestock",
              "Left it in the field",
            ],
            correctAnswer: 1,
            explanation:
              "Miguel composted rice straw and added it back to his fields, increasing soil organic matter from 2% to 4.5% over three years.",
          },
          {
            id: 5,
            question: "How often should farmers conduct soil tests?",
            options: [
              "Every year",
              "Every 2-3 years",
              "Every 5 years",
              "Only when problems occur",
            ],
            correctAnswer: 1,
            explanation:
              "Farmers should test soil every 2-3 years to monitor nutrient levels, pH, and organic matter content for optimal crop management.",
          },
          {
            id: 6,
            question: "What is NOT a warning sign of poor soil health?",
            options: [
              "Stunted plant growth",
              "Yellow leaves",
              "High earthworm population",
              "Poor water infiltration",
            ],
            correctAnswer: 2,
            explanation:
              "A high earthworm population is actually a sign of GOOD soil health, as earthworms improve soil structure and nutrient cycling.",
          },
          {
            id: 7,
            question:
              "How much did Teresa Lopez reduce fertilizer costs with balanced fertilization?",
            options: ["10%", "20%", "30%", "40%"],
            correctAnswer: 1,
            explanation:
              "By using soil test results to apply balanced NPK fertilizer instead of only urea, Teresa decreased costs by 20% while increasing yields by 35%.",
          },
        ],
      },
    ] as Lesson[],
    skills: [
      "Soil Testing",
      "pH Management",
      "Nutrient Analysis",
      "Composting",
    ],
    certificate: true,
  },

  "livestock-care": {
    title: "Livestock Care Fundamentals",
    description:
      "Essential practices for livestock health, feeding, and disease prevention.",
    duration: "2 hours",
    level: "Beginner" as const,
    rating: 4.5,
    enrolled: 420,
    progress: 0,
    lessons: [
      {
        id: 1,
        title: "Introduction to Livestock Management",
        duration: "33 mins",
        type: "video" as const,
        completed: false,
        description: "Overview of livestock care basics",
        videoUrl: "https://www.youtube.com/watch?v=75Nua4hqpHY",
      },
      {
        id: 2,
        title: "Proper Feeding and Nutrition",
        duration: "12 mins",
        type: "video" as const,
        completed: false,
        description: "Understanding livestock nutritional needs",
        videoUrl: "https://www.youtube.com/watch?v=3OwCx6ORLCo",
      },
      {
        id: 3,
        title: "Disease Prevention",
        duration: "1 hour",
        type: "video" as const,
        completed: false,
        description: "Common diseases and prevention methods",
        videoUrl: "https://www.youtube.com/watch?v=CAj4wQCbEdQ",
      },
      {
        id: 4,
        title: "Reading: Successful Livestock Management",
        duration: "10 mins",
        type: "reading" as const,
        completed: false,
        description: "Case studies from successful livestock farmers",
        content: `
          <h3>Livestock Care Fundamentals: Success Stories from the Philippines</h3>
          
          <h4>The Importance of Proper Livestock Care</h4>
          <p>Good livestock management is essential for animal health, productivity, and farm profitability. Proper care can reduce mortality rates by 60% and increase productivity by 40% while ensuring animal welfare.</p>
          
          <h4>Basic Livestock Needs</h4>
          <ul>
            <li><strong>Proper Nutrition:</strong> Balanced feed and clean water</li>
            <li><strong>Adequate Shelter:</strong> Protection from weather extremes</li>
            <li><strong>Health Care:</strong> Vaccinations and disease prevention</li>
            <li><strong>Clean Environment:</strong> Regular cleaning and waste management</li>
            <li><strong>Space:</strong> Adequate room to move and rest</li>
          </ul>
          
          <h4>Case Study: Improved Pig Farming in Bulacan</h4>
          <p>Farmer Ricardo Ramos struggled with high piglet mortality (30%) and slow growth rates. After attending a livestock management training, he implemented:</p>
          <ul>
            <li>Proper ventilation in pig houses</li>
            <li>Regular vaccination schedules</li>
            <li>Balanced commercial feed supplemented with vegetables</li>
            <li>Daily cleaning and disinfection protocols</li>
          </ul>
          <p>Results after 6 months:</p>
          <ul>
            <li>Mortality rate reduced to <strong>5%</strong></li>
            <li>Market weight reached 30 days earlier</li>
            <li>Feed conversion ratio improved by <strong>25%</strong></li>
            <li>Profit increased by <strong>50%</strong></li>
          </ul>
          
          <h4>Poultry Success in Pampanga</h4>
          <p>Maria Angeles raised native chickens but faced low egg production and frequent diseases. She improved her practices by:</p>
          <ul>
            <li>Installing proper roosting areas and nesting boxes</li>
            <li>Providing layer feed with calcium supplements</li>
            <li>Implementing biosecurity measures</li>
            <li>Maintaining vaccination records</li>
          </ul>
          <p>Improvements:</p>
          <ul>
            <li>Egg production increased from 40% to <strong>75%</strong></li>
            <li>Disease outbreaks reduced by <strong>80%</strong></li>
            <li>Healthier, more vigorous birds</li>
            <li>Income doubled within one year</li>
          </ul>
          
          <h4>Goat Farming in Mindanao</h4>
          <p>Jose Bautista started goat farming but struggled with parasites and poor weight gain. After consulting with agricultural extension workers, he:</p>
          <ul>
            <li>Implemented rotational grazing</li>
            <li>Provided elevated resting platforms</li>
            <li>Followed regular deworming schedules</li>
            <li>Supplemented grazing with concentrate feed</li>
          </ul>
          <p>Results:</p>
          <ul>
            <li>Parasite load decreased by <strong>70%</strong></li>
            <li>Average daily weight gain increased by <strong>40%</strong></li>
            <li>Breeding success rate improved to <strong>90%</strong></li>
            <li>Mortality rate dropped from 25% to <strong>8%</strong></li>
          </ul>
          
          <h4>Key Livestock Management Practices</h4>
          <ul>
            <li><strong>Biosecurity:</strong> Control animal movement and visitor access</li>
            <li><strong>Record Keeping:</strong> Track health, breeding, and production</li>
            <li><strong>Regular Health Checks:</strong> Monitor for signs of illness</li>
            <li><strong>Proper Feeding:</strong> Provide appropriate nutrition for age and purpose</li>
            <li><strong>Clean Water:</strong> Fresh, clean water available at all times</li>
            <li><strong>Stress Reduction:</strong> Minimize handling and environmental stress</li>
          </ul>
          
          <h4>Warning Signs of Health Problems</h4>
          <ul>
            <li>Loss of appetite or reduced water intake</li>
            <li>Abnormal discharge from eyes, nose, or other openings</li>
            <li>Difficulty breathing or coughing</li>
            <li>Diarrhea or abnormal droppings</li>
            <li>Lethargy or separation from the group</li>
            <li>Sudden weight loss</li>
          </ul>
        `,
      },
      {
        id: 5,
        title: "Housing and Shelter Requirements",
        duration: "32 mins",
        type: "video" as const,
        completed: false,
        description: "Creating optimal living conditions",
        videoUrl: "https://www.youtube.com/watch?v=v8HSvUkZs88",
      },
      {
        id: 6,
        title: "Final Assessment",
        duration: "8 mins",
        type: "quiz" as const,
        completed: false,
        description: "Test your livestock care knowledge",
        questions: [
          {
            id: 1,
            question: "Proper livestock care can reduce mortality rates by:",
            options: ["30%", "45%", "60%", "75%"],
            correctAnswer: 2,
            explanation:
              "Studies show that proper livestock management practices can reduce mortality rates by up to 60% through better health care and disease prevention.",
          },
          {
            id: 2,
            question: "What did Ricardo Ramos do to reduce piglet mortality?",
            options: [
              "Used antibiotics only",
              "Implemented ventilation, vaccination, and cleaning protocols",
              "Reduced feeding amounts",
              "Separated all pigs individually",
            ],
            correctAnswer: 1,
            explanation:
              "Ricardo implemented comprehensive improvements including proper ventilation, regular vaccinations, balanced feed, and daily cleaning protocols.",
          },
          {
            id: 3,
            question: "How much did Maria Angeles increase egg production?",
            options: [
              "From 40% to 55%",
              "From 40% to 65%",
              "From 40% to 75%",
              "From 40% to 85%",
            ],
            correctAnswer: 2,
            explanation:
              "By improving housing, nutrition, and biosecurity, Maria increased egg production from 40% to 75%.",
          },
          {
            id: 4,
            question:
              "What practice did Jose Bautista use to reduce parasite load in goats?",
            options: [
              "Daily bathing",
              "Rotational grazing and regular deworming",
              "Indoor housing only",
              "Reduced feeding",
            ],
            correctAnswer: 1,
            explanation:
              "Jose implemented rotational grazing and followed regular deworming schedules, reducing parasite load by 70%.",
          },
          {
            id: 5,
            question: "Which is NOT a basic livestock need?",
            options: [
              "Proper nutrition",
              "Adequate shelter",
              "Expensive equipment",
              "Clean water",
            ],
            correctAnswer: 2,
            explanation:
              "Expensive equipment is not a basic need. Livestock require proper nutrition, shelter, health care, clean environment, space, and clean water.",
          },
          {
            id: 6,
            question: "What is a warning sign of livestock health problems?",
            options: [
              "Normal eating behavior",
              "Active movement",
              "Loss of appetite and lethargy",
              "Social interaction",
            ],
            correctAnswer: 2,
            explanation:
              "Loss of appetite and lethargy are key warning signs that an animal may be sick and needs attention.",
          },
          {
            id: 7,
            question: "Why is biosecurity important in livestock management?",
            options: [
              "It makes animals grow faster",
              "It prevents disease introduction and spread",
              "It reduces feed costs",
              "It increases breeding rates",
            ],
            correctAnswer: 1,
            explanation:
              "Biosecurity measures control animal movement and visitor access to prevent the introduction and spread of diseases in your livestock.",
          },
        ],
      },
    ] as Lesson[],
    skills: [
      "Animal Health",
      "Feeding Management",
      "Disease Prevention",
      "Biosecurity",
    ],
    certificate: true,
  },

  "water-conservation": {
    title: "Irrigation & Water Conservation",
    description:
      "Efficient water use, irrigation systems, and conservation techniques for sustainable farming.",
    duration: "3 hours",
    level: "Intermediate" as const,
    rating: 4.8,
    enrolled: 780,
    progress: 0,
    lessons: [
      {
        id: 1,
        title: "Water Management Basics",
        duration: "3 mins",
        type: "video" as const,
        completed: false,
        description: "Understanding water needs and efficiency",
        videoUrl: "https://www.youtube.com/watch?v=ba0In5ezHXc",
      },
      {
        id: 2,
        title: "Types of Irrigation Systems",
        duration: "8 mins",
        type: "video" as const,
        completed: false,
        description: "Drip, sprinkler, and surface irrigation methods",
        videoUrl: "https://www.youtube.com/watch?v=Z9HAy9EYKKs", 
      },
      {
        id: 3,
        title: "Water Conservation Techniques",
        duration: "2 hours 14 mins",
        type: "video" as const,
        completed: false,
        description: "Strategies to reduce water waste",
        videoUrl: "https://www.youtube.com/watch?v=e5Ro1mergWA",
      },
      {
        id: 4,
        title: "Reading: Water Management Success Stories",
        duration: "12 mins",
        type: "reading" as const,
        completed: false,
        description: "Farmers who improved water efficiency",
        content: `
          <h3>Irrigation & Water Conservation: Filipino Farmers Leading the Way</h3>
          
          <h4>The Water Challenge in Philippine Agriculture</h4>
          <p>Water scarcity affects many farming regions, especially during dry seasons. Efficient irrigation can reduce water use by 40-60% while maintaining or increasing crop yields. Smart water management is crucial for sustainable and profitable farming.</p>
          
          <h4>Types of Irrigation Systems</h4>
          <ul>
            <li><strong>Drip Irrigation:</strong> 90-95% water efficiency, delivers water directly to roots</li>
            <li><strong>Sprinkler Systems:</strong> 70-80% efficiency, suitable for various crops</li>
            <li><strong>Surface/Flood Irrigation:</strong> 40-50% efficiency, traditional method</li>
            <li><strong>Micro-Sprinklers:</strong> 80-85% efficiency, good for orchards</li>
          </ul>
          
          <h4>Case Study: Drip Irrigation in Ilocos</h4>
          <p>Tomato farmer Liza Fernandez faced water shortages during the dry season, limiting her planting. She installed a simple drip irrigation system using:</p>
          <ul>
            <li>PVC pipes and drip tape</li>
            <li>A small water storage tank</li>
            <li>Mulching to reduce evaporation</li>
          </ul>
          <p>Results after one season:</p>
          <ul>
            <li>Water use reduced by <strong>50%</strong></li>
            <li>Tomato yields increased by <strong>30%</strong></li>
            <li>Weed growth decreased by <strong>70%</strong></li>
            <li>Could plant during dry season</li>
            <li>ROI achieved in <strong>18 months</strong></li>
          </ul>
          
          <h4>Rainwater Harvesting in Cavite</h4>
          <p>Vegetable farmer Antonio Reyes built a rainwater collection system during the wet season:</p>
          <ul>
            <li>Collected roof runoff in 5,000-liter tanks</li>
            <li>Used harvested water during dry periods</li>
            <li>Combined with drip irrigation</li>
          </ul>
          <p>Benefits:</p>
          <ul>
            <li>Eliminated water bills during 6-month dry season</li>
            <li>Extended growing season by <strong>3 months</strong></li>
            <li>Reduced reliance on groundwater by <strong>80%</strong></li>
            <li>Total system cost: ₱35,000, saved ₱15,000/year</li>
          </ul>
          
          <h4>Mulching Success in Benguet</h4>
          <p>Strawberry farmer Carmen Diaz struggled with water costs and soil moisture retention. She implemented organic mulching:</p>
          <ul>
            <li>Applied rice straw between plant rows</li>
            <li>Used plastic mulch on beds</li>
            <li>Installed simple drip lines under mulch</li>
          </ul>
          <p>Improvements:</p>
          <ul>
            <li>Soil moisture retention improved by <strong>60%</strong></li>
            <li>Watering frequency reduced from daily to every 3 days</li>
            <li>Fruit quality improved (cleaner berries)</li>
            <li>Water costs decreased by <strong>40%</strong></li>
          </ul>
          
          <h4>Smart Scheduling in Nueva Ecija</h4>
          <p>Rice farmer Eduardo Santos used soil moisture monitoring and weather forecasts to optimize irrigation timing:</p>
          <ul>
            <li>Installed simple soil moisture sensors (₱500 each)</li>
            <li>Checked weather apps for rainfall predictions</li>
            <li>Irrigated based on crop needs, not fixed schedule</li>
          </ul>
          <p>Results:</p>
          <ul>
            <li>Water use reduced by <strong>35%</strong></li>
            <li>Rice yields maintained at same level</li>
            <li>Pumping costs decreased by <strong>₱8,000 per season</strong></li>
            <li>Better crop health due to avoiding overwatering</li>
          </ul>
          
          <h4>Water Conservation Best Practices</h4>
          <ul>
            <li><strong>Choose Efficient Systems:</strong> Consider drip or micro-sprinkler</li>
            <li><strong>Mulch:</strong> Reduce evaporation by 50-70%</li>
            <li><strong>Harvest Rainwater:</strong> Capture wet season water</li>
            <li><strong>Time Irrigation:</strong> Early morning or evening</li>
            <li><strong>Monitor Soil Moisture:</strong> Water when needed, not on schedule</li>
            <li><strong>Maintain Systems:</strong> Fix leaks promptly</li>
            <li><strong>Select Appropriate Crops:</strong> Match crops to water availability</li>
          </ul>
          
          <h4>Signs of Poor Water Management</h4>
          <ul>
            <li>Waterlogged soil or standing water</li>
            <li>Wilting plants during daytime</li>
            <li>Uneven crop growth in field</li>
            <li>High water bills relative to yield</li>
            <li>Soil crust formation</li>
            <li>Frequent pump or system repairs</li>
          </ul>
        `,
      },
      {
        id: 5,
        title: "Rainwater Harvesting",
        duration: "3 mins",
        type: "video" as const,
        completed: false,
        description: "Capturing and storing rainwater",
        videoUrl: "https://www.youtube.com/watch?v=ba0In5ezHXc",
      },
      {
        id: 6,
        title: "Scheduling and Monitoring",
        duration: "1 hour and 30 mins",
        type: "video" as const,
        completed: false,
        description: "When and how much to irrigate",
        videoUrl: "https://www.youtube.com/watch?v=x0yeOvBkuBU",
      },
      {
        id: 7,
        title: "Final Assessment",
        duration: "10 mins",
        type: "quiz" as const,
        completed: false,
        description: "Test your water management knowledge",
        questions: [
          {
            id: 1,
            question:
              "What is the water efficiency of drip irrigation systems?",
            options: ["50-60%", "70-80%", "90-95%", "100%"],
            correctAnswer: 2,
            explanation:
              "Drip irrigation systems are highly efficient, delivering water directly to plant roots with 90-95% efficiency.",
          },
          {
            id: 2,
            question:
              "How much did Liza Fernandez reduce water use with drip irrigation?",
            options: ["30%", "40%", "50%", "60%"],
            correctAnswer: 2,
            explanation:
              "By installing a drip irrigation system, Liza reduced water use by 50% while increasing tomato yields by 30%.",
          },
          {
            id: 3,
            question:
              "What did Antonio Reyes collect in his 5,000-liter tanks?",
            options: [
              "Groundwater",
              "River water",
              "Rainwater from roof runoff",
              "Municipal water",
            ],
            correctAnswer: 2,
            explanation:
              "Antonio built a rainwater harvesting system that collected roof runoff in tanks, eliminating water bills during the dry season.",
          },
          {
            id: 4,
            question: "How much can mulching improve soil moisture retention?",
            options: ["20%", "40%", "60%", "80%"],
            correctAnswer: 2,
            explanation:
              "Carmen Diaz's mulching improved soil moisture retention by 60%, reducing watering frequency from daily to every 3 days.",
          },
          {
            id: 5,
            question: "When is the best time to irrigate crops?",
            options: [
              "During midday heat",
              "Early morning or evening",
              "At midnight",
              "Anytime during daylight",
            ],
            correctAnswer: 1,
            explanation:
              "Early morning or evening irrigation reduces water loss through evaporation and ensures better water absorption.",
          },
          {
            id: 6,
            question:
              "What did Eduardo Santos use to optimize irrigation timing?",
            options: [
              "Fixed daily schedule",
              "Soil moisture sensors and weather forecasts",
              "Neighbor's advice",
              "Random timing",
            ],
            correctAnswer: 1,
            explanation:
              "Eduardo used soil moisture sensors and weather forecasts to irrigate based on actual crop needs, reducing water use by 35%.",
          },
          {
            id: 7,
            question:
              "How long did it take Liza to achieve ROI on her drip irrigation system?",
            options: ["6 months", "12 months", "18 months", "24 months"],
            correctAnswer: 2,
            explanation:
              "Liza achieved return on investment in 18 months through water savings and increased yields from her drip irrigation system.",
          },
          {
            id: 8,
            question: "Which is NOT a sign of poor water management?",
            options: [
              "Waterlogged soil",
              "Wilting plants during daytime",
              "Even crop growth throughout field",
              "High water bills",
            ],
            correctAnswer: 2,
            explanation:
              "Even crop growth is actually a GOOD sign, indicating proper water distribution. Uneven growth suggests poor water management.",
          },
        ],
      },
    ] as Lesson[],
    skills: [
      "Irrigation Systems",
      "Water Conservation",
      "Rainwater Harvesting",
      "Moisture Management",
    ],
    certificate: true,
  },
};

const LESSON_ICONS = {
  video: PlayCircle,
  reading: FileText,
  quiz: Award,
};

// Convert YouTube URL to embed URL
function getYouTubeEmbedUrl(url: string) {
  const videoId = url.split("v=")[1]?.split("&")[0];
  return `https://www.youtube.com/embed/${videoId}?enablejsapi=1`;
}

// Certificate Component
const Certificate = ({
  course,
  userName,
  onClose,
}: {
  course: any;
  userName: string;
  onClose: () => void;
}) => {
  const certificateRef = useRef<HTMLDivElement>(null);
  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const handleDownload = async () => {
    // Create a canvas to convert the certificate to an image
    const certificate = certificateRef.current;
    if (!certificate) return;

    try {
      // Using html2canvas (you'll need to install: npm install html2canvas)
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(certificate, {
        scale: 2,
        backgroundColor: "#ffffff",
      });

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `AgriReach_Certificate_${course.title.replace(
            /\s+/g,
            "_"
          )}.png`;
          link.click();
          URL.revokeObjectURL(url);
        }
      });
    } catch (error) {
      console.error("Error downloading certificate:", error);
      alert("Failed to download certificate. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold">
              🎓 Course Completion Certificate
            </h2>
            <p className="text-sm text-muted-foreground">
              Congratulations on completing the course!
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6">
          {/* Certificate Design */}
          <div
            ref={certificateRef}
            className="bg-white border-8 border-double border-green-600 p-12 rounded-lg"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="bg-green-600 rounded-full p-4">
                  <Trophy className="h-12 w-12 text-white" />
                </div>
              </div>
              <h1 className="text-4xl font-bold text-green-800 mb-2">
                Certificate of Completion
              </h1>
              <div className="h-1 w-32 bg-green-600 mx-auto rounded"></div>
            </div>

            {/* Body */}
            <div className="text-center space-y-6 mb-8">
              <p className="text-lg text-gray-600">This is to certify that</p>

              <div className="border-b-2 border-green-600 pb-2 max-w-md mx-auto">
                <p className="text-3xl font-bold text-gray-900">{userName}</p>
              </div>

              <p className="text-lg text-gray-600">
                has successfully completed the course
              </p>

              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold text-green-800 mb-2">
                  {course.title}
                </h3>
                <p className="text-sm text-gray-600">
                  Instructor: {course.instructor}
                </p>
                <p className="text-sm text-gray-600">
                  Duration: {course.duration} • Level: {course.level}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mt-6">
                <div className="bg-white border border-green-200 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Skills Acquired</p>
                  <div className="flex flex-wrap gap-1">
                    {course.skills.map((skill: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="bg-white border border-green-200 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Completion Stats</p>
                  <div className="space-y-1 text-sm">
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      {course.lessons.length} lessons completed
                    </p>
                    <p className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      Course rating: {course.rating}/5.0
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t-2 border-gray-200 pt-6">
              <div className="flex justify-between items-end">
                <div className="text-left">
                  <p className="text-sm text-gray-600">Date of Completion</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {currentDate}
                  </p>
                </div>
                <div className="text-center">
                  <div className="mb-2">
                    <img
                      src="/api/placeholder/120/60"
                      alt="AgriReach Logo"
                      className="h-12 mx-auto"
                    />
                  </div>
                  <div className="border-t-2 border-gray-800 pt-1">
                    <p className="text-sm font-semibold">AgriReach Platform</p>
                    <p className="text-xs text-gray-600">
                      Agricultural Learning Portal
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Certificate ID</p>
                  <p className="text-xs font-mono text-gray-900">
                    AGR-{Date.now().toString(36).toUpperCase()}
                  </p>
                </div>
              </div>
            </div>

            {/* Watermark */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-400">
                Verify this certificate at agrireach.com/verify
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <Button onClick={handleDownload} className="flex-1" size="lg">
              <Download className="h-5 w-5 mr-2" />
              Download Certificate
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              Close
            </Button>
          </div>

          {/* Social Share */}
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <p className="text-sm font-semibold text-center mb-3">
              🎉 Share your achievement!
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share on Facebook
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share on LinkedIn
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function CoursePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const modalContentRef = useRef<HTMLDivElement>(null);
  const course =
    COURSES[id as keyof typeof COURSES] || COURSES["intro-agritech"];
  const [activeTab, setActiveTab] = useState("overview");
  const [lessonProgress, setLessonProgress] = useState<Record<number, boolean>>(
    course.lessons.reduce((acc, lesson) => {
      acc[lesson.id] = lesson.completed;
      return acc;
    }, {} as Record<number, boolean>)
  );
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);

  const completedLessons = Object.values(lessonProgress).filter(Boolean).length;
  const totalLessons = course.lessons.length;
  const progressPercentage = Math.round(
    (completedLessons / totalLessons) * 100
  );
  const isCourseCompleted = completedLessons === totalLessons;

  const handleLessonClick = (lesson: Lesson) => {
    if (lesson.type === "video" && lesson.videoUrl) {
      setActiveLesson(lesson);
    } else if (lesson.type === "reading") {
      setActiveLesson(lesson);
    } else if (lesson.type === "quiz") {
      setActiveLesson(lesson);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setShowQuizResults(false);
    }
  };

  const handleQuizAnswer = (questionId: number, answerIndex: number) => {
    if (!quizSubmitted) {
      setQuizAnswers((prev) => ({
        ...prev,
        [questionId]: answerIndex,
      }));
    }
  };

  const handleQuizSubmit = () => {
    const questions = activeLesson?.questions || [];
    const totalQuestions = questions.length;
    const answeredQuestions = Object.keys(quizAnswers).length;

    if (answeredQuestions < totalQuestions) {
      alert(`Please answer all ${totalQuestions} questions before submitting.`);
      return;
    }

    setQuizSubmitted(true);
    setShowQuizResults(true);

    // Calculate score
    const correctAnswers = questions.filter(
      (q) => quizAnswers[q.id] === q.correctAnswer
    ).length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);

    // Auto-mark as complete if passed (70% or higher)
    if (score >= 70) {
      setTimeout(() => {
        handleMarkComplete();
      }, 500);
    }
  };

  const handleRetakeQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setShowQuizResults(false);
  };

  const calculateQuizScore = () => {
    if (!activeLesson?.questions)
      return { correct: 0, total: 0, percentage: 0 };

    const questions = activeLesson.questions;
    const correct = questions.filter(
      (q) => quizAnswers[q.id] === q.correctAnswer
    ).length;
    const total = questions.length;
    const percentage = Math.round((correct / total) * 100);

    return { correct, total, percentage };
  };

  const handleMarkComplete = () => {
    if (activeLesson) {
      const newProgress = {
        ...lessonProgress,
        [activeLesson.id]: true,
      };
      setLessonProgress(newProgress);

      // Check if this was the last lesson
      const completedCount = Object.values(newProgress).filter(Boolean).length;
      if (completedCount === totalLessons && course.certificate) {
        setTimeout(() => {
          setActiveLesson(null);
          setShowCertificate(true);
        }, 1000);
      }
    }
  };

  const handleNextLesson = () => {
    if (activeLesson) {
      const currentIndex = course.lessons.findIndex(
        (l) => l.id === activeLesson.id
      );
      if (currentIndex < course.lessons.length - 1) {
        const nextLesson = course.lessons[currentIndex + 1];
        handleLessonClick(nextLesson);
        // Scroll to top of modal
        setTimeout(() => {
          modalContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      } else {
        // Last lesson - check if course is completed
        if (isCourseCompleted) {
          setActiveLesson(null);
          setShowCertificate(true);
        } else {
          alert("Congratulations! You've completed all lessons!");
          setActiveLesson(null);
        }
      }
    }
  };

  const handlePreviousLesson = () => {
    if (activeLesson) {
      const currentIndex = course.lessons.findIndex(
        (l) => l.id === activeLesson.id
      );
      if (currentIndex > 0) {
        const prevLesson = course.lessons[currentIndex - 1];
        handleLessonClick(prevLesson);
        // Scroll to top of modal
        setTimeout(() => {
          modalContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      }
    }
  };

  const currentLessonIndex = activeLesson
    ? course.lessons.findIndex((l) => l.id === activeLesson.id)
    : -1;
  const isFirstLesson = currentLessonIndex === 0;
  const isLastLesson = currentLessonIndex === course.lessons.length - 1;

  const handleCloseLesson = () => {
    setActiveLesson(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Certificate Modal */}
      {showCertificate && (
        <Certificate
          course={course}
          userName="Vincent Ong"
          onClose={() => setShowCertificate(false)}
        />
      )}

      {/* Video/Reading/Quiz Modal */}
      {activeLesson && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div ref={modalContentRef} className="bg-background rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold">{activeLesson.title}</h2>
                  {lessonProgress[activeLesson.id] && (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {activeLesson.description}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Lesson {currentLessonIndex + 1} of {course.lessons.length}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCloseLesson}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6">
              {activeLesson.type === "video" && activeLesson.videoUrl && (
                <div className="space-y-4">
                  <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                    <iframe
                      src={getYouTubeEmbedUrl(activeLesson.videoUrl)}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{activeLesson.duration}</span>
                  </div>
                </div>
              )}

              {activeLesson.type === "reading" && (
                <div className="space-y-6">
                  {/* Reading Content with Better Formatting */}
                  <div className="space-y-6">
                    {/* Conditional rendering based on course */}
                    {id === "intro-agritech" ? (
                      <>
                        {/* Main Title */}
                        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border-l-4 border-green-600">
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            Success Stories: Digital Transformation in
                            Philippine Agriculture
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Learn from real farmers who transformed their farms
                            using technology
                          </p>
                        </div>

                        {/* Case Study 1 */}
                        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              <div className="bg-blue-100 rounded-full p-3 shrink-0">
                                <span className="text-2xl">🌾</span>
                              </div>
                              <div className="flex-1">
                                <h4 className="text-lg font-bold text-gray-900 mb-2">
                                  Case Study 1: Smart Rice Farming in Nueva
                                  Ecija
                                </h4>
                                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                                  Farmer Juan Dela Cruz increased his rice yield
                                  by{" "}
                                  <span className="font-bold text-green-600">
                                    30%
                                  </span>{" "}
                                  using precision agriculture tools. By adopting
                                  mobile apps for crop monitoring and weather
                                  forecasting, he reduced water consumption by{" "}
                                  <span className="font-bold text-blue-600">
                                    25%
                                  </span>{" "}
                                  while improving overall productivity.
                                </p>
                                <div className="flex gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    💧 Water Saving
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Case Study 2 */}
                        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              <div className="bg-green-100 rounded-full p-3 shrink-0">
                                <span className="text-2xl">🥬</span>
                              </div>
                              <div className="flex-1">
                                <h4 className="text-lg font-bold text-gray-900 mb-2">
                                  Case Study 2: Vegetable Farm Management in
                                  Benguet
                                </h4>
                                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                                  Maria Santos transformed her family's
                                  vegetable farm using digital record-keeping
                                  and market access platforms. She now connects
                                  directly with buyers through AgriReach
                                  marketplace, eliminating middlemen and
                                  increasing profits by{" "}
                                  <span className="font-bold text-green-600">
                                    40%
                                  </span>
                                  .
                                </p>
                                <div className="flex gap-2">
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    🏪 Market Access
                                  </Badge>
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    📊 Digital Records
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Case Study 3 */}
                        <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              <div className="bg-purple-100 rounded-full p-3 shrink-0">
                                <span className="text-2xl">🐄</span>
                              </div>
                              <div className="flex-1">
                                <h4 className="text-lg font-bold text-gray-900 mb-2">
                                  Case Study 3: Livestock Monitoring in Mindanao
                                </h4>
                                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                                  Pedro Garcia implemented IoT sensors for his
                                  livestock operation, reducing disease
                                  outbreaks by{" "}
                                  <span className="font-bold text-red-600">
                                    50%
                                  </span>{" "}
                                  through early detection. Mobile health
                                  tracking helped him maintain better records
                                  and improve breeding programs.
                                </p>
                                <div className="flex gap-2">
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    🔔 IoT Sensors
                                  </Badge>
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    🏥 Health Tracking
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Key Takeaways */}
                        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300">
                          <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                              <Trophy className="h-6 w-6 text-yellow-600" />
                              <h4 className="text-xl font-bold text-gray-900">
                                Key Takeaways
                              </h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="flex items-start gap-3 bg-white p-3 rounded-lg">
                                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">
                                    Reduce Costs
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Digital tools reduce input costs by 15-30%
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3 bg-white p-3 rounded-lg">
                                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">
                                    Better Pricing
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Mobile apps improve market access and fair
                                    pricing
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3 bg-white p-3 rounded-lg">
                                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">
                                    Higher Yields
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Data-driven decisions lead to better yields
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3 bg-white p-3 rounded-lg">
                                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">
                                    Low Investment
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Technology adoption doesn't require large
                                    investments
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    ) : (
                      <>
                        {/* Pesticide Safety Reading */}
                        {/* Main Title */}
                        <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-lg border-l-4 border-red-600">
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            Pesticide Safety: Health Guidelines and Best
                            Practices
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Essential safety protocols to protect yourself and
                            the environment
                          </p>
                        </div>

                        {/* WHO Guidelines */}
                        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              <div className="bg-blue-100 rounded-full p-3 shrink-0">
                                <span className="text-2xl">🏥</span>
                              </div>
                              <div className="flex-1">
                                <h4 className="text-lg font-bold text-gray-900 mb-2">
                                  WHO Guidelines for Pesticide Use
                                </h4>
                                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                                  The World Health Organization emphasizes that
                                  proper pesticide handling is crucial for
                                  farmer health and environmental protection.
                                  Studies show that following safety protocols
                                  reduces health risks by up to{" "}
                                  <span className="font-bold text-green-600">
                                    80%
                                  </span>
                                  .
                                </p>
                                <div className="flex gap-2">
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    🛡️ Risk Reduction
                                  </Badge>
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    🌍 WHO Standards
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Philippine Standards */}
                        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              <div className="bg-green-100 rounded-full p-3 shrink-0">
                                <span className="text-2xl">🇵🇭</span>
                              </div>
                              <div className="flex-1">
                                <h4 className="text-lg font-bold text-gray-900 mb-2">
                                  Philippine Regulatory Standards
                                </h4>
                                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                                  The Fertilizer and Pesticide Authority (FPA)
                                  mandates strict compliance with safety
                                  standards. All applications must follow label
                                  instructions, use appropriate PPE, and
                                  maintain buffer zones near water sources and
                                  residential areas.
                                </p>
                                <div className="flex gap-2">
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    📋 FPA Compliance
                                  </Badge>
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    🏛️ Local Standards
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Health Risks */}
                        <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              <div className="bg-red-100 rounded-full p-3 shrink-0">
                                <span className="text-2xl">⚠️</span>
                              </div>
                              <div className="flex-1">
                                <h4 className="text-lg font-bold text-gray-900 mb-2">
                                  Key Health Risks
                                </h4>
                                <div className="space-y-2 text-sm text-gray-700">
                                  <div>
                                    <p className="font-semibold">
                                      Acute Exposure:
                                    </p>
                                    <p className="text-muted-foreground">
                                      Skin irritation, respiratory problems,
                                      nausea, and dizziness
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-semibold">
                                      Chronic Exposure:
                                    </p>
                                    <p className="text-muted-foreground">
                                      Respiratory diseases and nervous system
                                      damage
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-semibold">
                                      Environmental Impact:
                                    </p>
                                    <p className="text-muted-foreground">
                                      Water contamination, soil degradation, and
                                      harm to beneficial insects
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Safety Best Practices */}
                        <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              <div className="bg-purple-100 rounded-full p-3 shrink-0">
                                <span className="text-2xl">✅</span>
                              </div>
                              <div className="flex-1">
                                <h4 className="text-lg font-bold text-gray-900 mb-3">
                                  Safety Best Practices
                                </h4>
                                <div className="space-y-3">
                                  <div className="bg-blue-50 p-3 rounded-lg">
                                    <p className="font-semibold text-sm mb-2">
                                      Before Application:
                                    </p>
                                    <ul className="text-xs space-y-1 text-gray-700 list-disc list-inside">
                                      <li>Read product labels completely</li>
                                      <li>Check weather conditions</li>
                                      <li>Inspect equipment for leaks</li>
                                      <li>Ensure PPE is available</li>
                                    </ul>
                                  </div>
                                  <div className="bg-green-50 p-3 rounded-lg">
                                    <p className="font-semibold text-sm mb-2">
                                      During Application:
                                    </p>
                                    <ul className="text-xs space-y-1 text-gray-700 list-disc list-inside">
                                      <li>Wear complete PPE</li>
                                      <li>Mix in well-ventilated areas</li>
                                      <li>Never eat, drink, or smoke</li>
                                      <li>Keep bystanders away</li>
                                    </ul>
                                  </div>
                                  <div className="bg-orange-50 p-3 rounded-lg">
                                    <p className="font-semibold text-sm mb-2">
                                      After Application:
                                    </p>
                                    <ul className="text-xs space-y-1 text-gray-700 list-disc list-inside">
                                      <li>Wash hands thoroughly</li>
                                      <li>Clean equipment properly</li>
                                      <li>Dispose containers safely</li>
                                      <li>Post warning signs</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Emergency Response */}
                        <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-300">
                          <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                              <AlertCircle className="h-6 w-6 text-red-600" />
                              <h4 className="text-xl font-bold text-gray-900">
                                Emergency Response
                              </h4>
                            </div>
                            <p className="text-sm font-semibold mb-3">
                              In case of pesticide exposure:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="flex items-start gap-3 bg-white p-3 rounded-lg">
                                <CheckCircle2 className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">
                                    Immediate Action
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Remove contaminated clothing and rinse for
                                    15 minutes
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3 bg-white p-3 rounded-lg">
                                <CheckCircle2 className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">
                                    Seek Medical Help
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Call PGH Poison Control: (02) 8554-8400
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Quiz Section */}
              {activeLesson.type === "quiz" && activeLesson.questions && (
                <div className="space-y-6">
                  {/* Quiz Header */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border-l-4 border-purple-600">
                    <div className="flex items-center gap-3 mb-2">
                      <Award className="h-8 w-8 text-purple-600" />
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">
                          Agritech Basics Quiz
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Test your understanding of core concepts
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-purple-600" />
                        <span>{activeLesson.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-purple-600" />
                        <span>{activeLesson.questions.length} questions</span>
                      </div>
                      {quizSubmitted && (
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-yellow-600" />
                          <span className="font-semibold">
                            Score: {calculateQuizScore().percentage}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quiz Results Summary */}
                  {showQuizResults && (
                    <Card
                      className={`border-2 ${
                        calculateQuizScore().percentage >= 70
                          ? "border-green-500 bg-green-50"
                          : "border-orange-500 bg-orange-50"
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div
                            className={`rounded-full p-3 ${
                              calculateQuizScore().percentage >= 70
                                ? "bg-green-100"
                                : "bg-orange-100"
                            }`}
                          >
                            {calculateQuizScore().percentage >= 70 ? (
                              <CheckCircle2 className="h-8 w-8 text-green-600" />
                            ) : (
                              <AlertCircle className="h-8 w-8 text-orange-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-xl font-bold mb-2">
                              {calculateQuizScore().percentage >= 70
                                ? "Congratulations! You Passed!"
                                : "Keep Learning!"}
                            </h4>
                            <p className="text-sm text-gray-700 mb-3">
                              You got {calculateQuizScore().correct} out of{" "}
                              {calculateQuizScore().total} questions correct (
                              {calculateQuizScore().percentage}%)
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {calculateQuizScore().percentage >= 70
                                ? "Great job! You've demonstrated a solid understanding of agritech basics."
                                : "You need 70% to pass. Review the lessons and try again!"}
                            </p>
                            {calculateQuizScore().percentage < 70 && (
                              <Button
                                onClick={handleRetakeQuiz}
                                variant="outline"
                                className="mt-3"
                                size="sm"
                              >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Retake Quiz
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Quiz Questions */}
                  <div className="space-y-6">
                    {activeLesson.questions.map((question, qIndex) => {
                      const selectedAnswer = quizAnswers[question.id];
                      const isCorrect =
                        selectedAnswer === question.correctAnswer;
                      const showFeedback = quizSubmitted;

                      return (
                        <Card
                          key={question.id}
                          className={`${
                            showFeedback
                              ? isCorrect
                                ? "border-green-500 bg-green-50"
                                : selectedAnswer !== undefined
                                ? "border-red-500 bg-red-50"
                                : ""
                              : ""
                          }`}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start gap-3 mb-4">
                              <div className="bg-purple-100 rounded-full w-8 h-8 flex items-center justify-center shrink-0">
                                <span className="font-bold text-purple-700">
                                  {qIndex + 1}
                                </span>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 mb-4">
                                  {question.question}
                                </h4>

                                {/* Answer Options */}
                                <div className="space-y-2">
                                  {question.options.map((option, optIndex) => {
                                    const isSelected =
                                      selectedAnswer === optIndex;
                                    const isCorrectOption =
                                      optIndex === question.correctAnswer;

                                    return (
                                      <button
                                        key={optIndex}
                                        onClick={() =>
                                          handleQuizAnswer(
                                            question.id,
                                            optIndex
                                          )
                                        }
                                        disabled={quizSubmitted}
                                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                                          quizSubmitted
                                            ? isCorrectOption
                                              ? "border-green-500 bg-green-100"
                                              : isSelected
                                              ? "border-red-500 bg-red-100"
                                              : "border-gray-200 bg-gray-50"
                                            : isSelected
                                            ? "border-purple-500 bg-purple-50"
                                            : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/50"
                                        } ${
                                          quizSubmitted
                                            ? "cursor-not-allowed"
                                            : "cursor-pointer"
                                        }`}
                                      >
                                        <div className="flex items-center gap-3">
                                          <div
                                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                              quizSubmitted
                                                ? isCorrectOption
                                                  ? "border-green-600 bg-green-600"
                                                  : isSelected
                                                  ? "border-red-600 bg-red-600"
                                                  : "border-gray-300"
                                                : isSelected
                                                ? "border-purple-600 bg-purple-600"
                                                : "border-gray-300"
                                            }`}
                                          >
                                            {(isSelected ||
                                              (quizSubmitted &&
                                                isCorrectOption)) && (
                                              <CheckCircle2 className="h-3 w-3 text-white" />
                                            )}
                                          </div>
                                          <span className="text-sm">
                                            {option}
                                          </span>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Explanation (shown after submission) */}
                                {showFeedback && (
                                  <div
                                    className={`mt-4 p-4 rounded-lg ${
                                      isCorrect
                                        ? "bg-green-100 border border-green-300"
                                        : "bg-blue-100 border border-blue-300"
                                    }`}
                                  >
                                    <div className="flex items-start gap-2">
                                      {isCorrect ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                                      ) : (
                                        <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                                      )}
                                      <div>
                                        <p className="font-semibold text-sm mb-1">
                                          {isCorrect ? "Correct!" : "Incorrect"}
                                        </p>
                                        <p className="text-sm text-gray-700">
                                          {question.explanation}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Submit Quiz Button */}
                  {!quizSubmitted && (
                    <div className="flex justify-center">
                      <Button
                        onClick={handleQuizSubmit}
                        size="lg"
                        className="min-w-[200px]"
                      >
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        Submit Quiz
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Lesson Navigation - Bottom Section */}
              <div className="mt-6 pt-6 border-t flex items-center justify-between gap-4">
                {/* Previous Button */}
                <Button
                  variant="outline"
                  onClick={handlePreviousLesson}
                  disabled={isFirstLesson}
                  className="flex-1 max-w-[200px]"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                {/* Mark as Complete Button */}
                <div className="flex-1 flex justify-center">
                  {!lessonProgress[activeLesson.id] ? (
                    <Button onClick={handleMarkComplete} size="lg">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Mark as Complete
                    </Button>
                  ) : (
                    <Badge variant="default" className="bg-green-600 py-2 px-4">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Completed
                    </Badge>
                  )}
                </div>

                {/* Next Button */}
                <Button
                  onClick={handleNextLesson}
                  className="flex-1 max-w-[200px]"
                >
                  {isLastLesson ? "Finish Course" : "Next Lesson"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white">
        <div className="container mx-auto px-4 py-4">
          {/* Breadcrumb with Back Button */}
          <div className="flex items-center gap-2 text-green-100 text-sm mb-2">
            <button
              onClick={() => router.push("/learning")}
              className="bg-white hover:bg-green-50 text-green-700 font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm hover:shadow-md"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Learning</span>
            </button>
            <ChevronRight className="h-3 w-3" />
            <span>{course.level}</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white font-medium">{course.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2">
              <h1 className="text-xl sm:text-2xl font-bold mb-1.5">
                {course.title}
              </h1>
              <p className="text-green-50 text-sm mb-2 line-clamp-2">
                {course.description}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>
                    {course.rating} ({course.enrolled.toLocaleString()}{" "}
                    enrolled)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => setActiveTab("lessons")}
                size="lg"
                className="bg-white text-green-700 hover:bg-green-50 flex-1"
              >
                <PlayCircle className="h-5 w-5 mr-2" />
                Continue Learning
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-md mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="lessons">Lessons</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {course.description}
                </p>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">What you'll learn:</h4>
                    <ul className="space-y-2">
                      {course.skills.map((skill, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>{skill}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lessons" className="space-y-4">
            {course.lessons.map((lesson, idx) => {
              const Icon = LESSON_ICONS[lesson.type];
              const isCompleted = lessonProgress[lesson.id];

              return (
                <Card
                  key={lesson.id}
                  className={`cursor-pointer transition-all ${
                    isCompleted ? "border-green-500" : ""
                  }`}
                  onClick={() => handleLessonClick(lesson)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-lg ${
                          isCompleted ? "bg-green-100" : "bg-gray-100"
                        }`}
                      >
                        <Icon
                          className={`h-5 w-5 ${
                            isCompleted ? "text-green-600" : "text-gray-600"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{lesson.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {lesson.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {lesson.duration}
                        </p>
                      </div>
                      {isCompleted && (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
