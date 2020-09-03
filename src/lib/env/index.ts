import pick from "lodash/pick";

// Config dot env
require('dotenv').config();

export interface EnvValues {
    TELEGRAM_BOT_API_KEY_PARAMETER_NAME: string;
    TELEGRAM_BOT_API_KEY_PARAMETER_VERSION: number;
    TELEGRAM_CHAT_ID_PARAMETER_NAME: string;
};

const keys: (keyof EnvValues)[] = [
    'TELEGRAM_BOT_API_KEY_PARAMETER_NAME',
    'TELEGRAM_BOT_API_KEY_PARAMETER_VERSION',
    'TELEGRAM_CHAT_ID_PARAMETER_NAME',
]
const values: EnvValues = pick(process.env, keys) as unknown as EnvValues;

/**
 * Throw an error if any of the environment variables is not defined
 */
const validate = () => {
    for (const [key, value] of Object.entries(values)) {
        if (value === undefined) {
            throw new Error(`${key} is undefined but required in .env file`)
        }
    }
}

export default {
    keys,
    values,
    validate,
} as const;