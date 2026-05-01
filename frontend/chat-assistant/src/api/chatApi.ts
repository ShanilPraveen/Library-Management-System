const GATEWAY_URL = 'http://localhost:4000';
import { ChatResponse } from "../utils/utilities";
import {useAuthStore} from '@lms/auth-client';

// Function to send message to backend chat endpoint
export async function sendMessage(message:string): Promise<string> {
    const token = useAuthStore.getState().token;
    
    if (!token) {
        throw new Error('Please log in to use the chat assistant');
    }
    
    try {
        const response = await fetch(`${GATEWAY_URL}/ai/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ msg : message })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            const errorMessage = errorData?.reply || errorData?.message || `Server error: ${response.status} ${response.statusText}`;
            throw new Error(errorMessage);
        }
        
        const data: ChatResponse = await response.json();
        return data.reply;
    } catch (error: any) {
        console.error('Error sending message:', error);
        throw error;
    }
};