'use client'

import React, { useState, useEffect } from 'react'
import { useChat } from '@/contexts/chat-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, MessageCircle, Plus } from 'lucide-react'

export function UserSearchModal() {
  const { searchUsers, selectConversation } = useChat()
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const users = await searchUsers(query)
      setSearchResults(users)
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleStartConversation = (user: any) => {
    // Create a temporary conversation object
    const conversation = {
      id: `temp-${user.id}`,
      other_user: user,
      last_message: undefined,
      last_message_at: undefined,
      created_at: new Date().toISOString(),
    }
    
    selectConversation(conversation)
    setIsOpen(false)
    setSearchQuery('')
    setSearchResults([])
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-start h-8 text-xs">
          <Plus className="h-3 w-3 mr-1" />
          Start New Conversation
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start New Conversation</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Search Results */}
          <ScrollArea className="max-h-64">
            {isSearching ? (
              <div className="text-center py-4 text-muted-foreground">Searching...</div>
            ) : searchResults.length === 0 && searchQuery ? (
              <div className="text-center py-4 text-muted-foreground">No users found</div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleStartConversation(user)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{user.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    </div>
                    
                    <Button variant="ghost" size="sm">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
