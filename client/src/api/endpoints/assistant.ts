import type { AxiosInstance } from 'axios'
import type { AssistantChatResponse } from '../../components/assistant/assistant.types'

export interface ChatMessageInput {
  role: 'user' | 'assistant'
  content: string
}

export interface AssistantChatInput {
  messages: ChatMessageInput[]
  image_base64?: string
  image_mime_type?: 'image/jpeg' | 'image/png'
}

export const assistantApi = {
  chat: (client: AxiosInstance, payload: AssistantChatInput) =>
    client.post<AssistantChatResponse>('/api/assistant/chat', payload).then((res) => res.data),
}
