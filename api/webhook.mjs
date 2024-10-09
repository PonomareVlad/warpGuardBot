import {bot, secretToken} from "../src/bot.mjs";
import {setWebhookCallback} from "vercel-grammy";

// Handler to set webhook url based on request headers
export default setWebhookCallback(bot, {
    path: "api/update",
    onError: "return",
    allowedEnvs: [
        "development",
        "preview"
    ],
    secretToken
});
