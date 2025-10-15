import mongoose, { Document, Schema } from 'mongoose'

export interface IChatMessage extends Document {
  sender_id: mongoose.Types.ObjectId
  recipient_id: mongoose.Types.ObjectId
  content: string
  message_type: 'text' | 'image' | 'file'
  read_at?: Date
  created_at: Date
  updated_at: Date
}

export interface IChatConversation extends Document {
  participants: mongoose.Types.ObjectId[]
  last_message?: mongoose.Types.ObjectId
  last_message_at?: Date
  created_at: Date
  updated_at: Date
}

const ChatMessageSchema = new Schema<IChatMessage>({
  sender_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recipient_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  message_type: { type: String, enum: ['text', 'image', 'file'], default: 'text' },
  read_at: { type: Date },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
})

const ChatConversationSchema = new Schema<IChatConversation>({
  participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  last_message: { type: Schema.Types.ObjectId, ref: 'ChatMessage' },
  last_message_at: { type: Date },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
})

// Indexes for better performance
ChatMessageSchema.index({ sender_id: 1, recipient_id: 1, created_at: -1 })
ChatMessageSchema.index({ recipient_id: 1, read_at: 1 })
ChatConversationSchema.index({ participants: 1 })
ChatConversationSchema.index({ last_message_at: -1 })

export const ChatMessage = mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema)
export const ChatConversation = mongoose.models.ChatConversation || mongoose.model<IChatConversation>('ChatConversation', ChatConversationSchema)
