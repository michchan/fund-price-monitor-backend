import axios from 'axios'


const API_BOT_API_KEY = `{{BOT_API_KEY}}`
const API_CHAT_ID = `{{CHAT_ID}}`
const API_TEXT = `{{TEXT}}`
const API_PARSE_MODE = `{{PARSE_MODE}}`
const API_PATTERN = `https://api.telegram.org/bot${API_BOT_API_KEY}/sendMessage?chat_id=${API_CHAT_ID}&text=${API_TEXT}&parse_mode=${API_PARSE_MODE}`

const sendMessage = (
    chatId: string,
    apiKey: string,
    text: string,
) => {
    // Create api uri
    const url = API_PATTERN
        .replace(API_BOT_API_KEY, apiKey)
        .replace(API_CHAT_ID, chatId)
        .replace(API_TEXT, encodeURIComponent(text))
        .replace(API_PARSE_MODE, 'Markdown')

    return axios.get(url) 
}

export default sendMessage