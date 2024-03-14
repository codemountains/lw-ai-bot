import {APIGatewayProxyEvent, APIGatewayProxyHandler} from "aws-lambda";
import SecretType from "./types/Secret.type";
import * as jwt from "jsonwebtoken";
import axios from "axios";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import UserAccountAuthType from "./types/AccessToken.type";

// @ts-ignore
const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
    console.info(event);

    // LINE WORKS のメッセージを受け取る
    const request = JSON.parse(event.body ?? "{}");

    if (typeof request.source.userId !== "string" || typeof request.content.text !== "string") {
        console.error("Invalid request");
        return {
            statusCode: 201,
        };
    }

    const secret = init();

    // ユーザーIDと送信されたメッセージを取得
    const userId = request.source.userId;
    const inputText = request.content.text;

    // トークンを生成
    const accessToken = await genAccessToken(secret);

    // AI にリクエストを送信
    const outputText = await chatAnthropic(secret, inputText);

    // LINE WORKS Bot にメッセージを送信
    await sendMessageWithActions(accessToken, secret.lineWorksBotId, userId, outputText);

    return {
        statusCode: 201,
    };
};

const init = (): SecretType => {
    return {
        lineWorksBotId: process.env.LINE_WORKS_BOT_ID ?? "",
        lineWorksClientId: process.env.LINE_WORKS_CLIENT_ID ?? "",
        lineWorksClientSecret: process.env.LINE_WORKS_CLIENT_SECRET ?? "",
        lineWorksDomainId: process.env.LINE_WORKS_DOMAIN_ID ?? "",
        lineWorksPrivateKey: process.env.LINE_WORKS_PRIVATE_KEY ?? "",
        lineWorksServiceAccount: process.env.LINE_WORKS_SERVICE_ACCOUNT ?? "",
        anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
    }
}

/**
 * Generate JWT
 * @param secret {SecretType} Secret in environment variables
 */
const genJwt = (secret: SecretType): string => {
    const payload = {
        iss: secret.lineWorksClientId,
        sub: secret.lineWorksServiceAccount,
        iat: Date.now(),
        exp: Date.now() + 3600,
    };
    const privateKey = secret.lineWorksPrivateKey.replace(/\\n/g, '\n');

    return jwt.sign(payload, privateKey, {algorithm: "RS256"});
}

/**
 * Generate Access token
 * @param secret {SecretType} Secret in environment variables
 */
const genAccessToken = async (secret: SecretType): Promise<string> => {
    const jwt = genJwt(secret);

    const params = new URLSearchParams({
        assertion: jwt,
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        client_id: secret.lineWorksClientId,
        client_secret: secret.lineWorksClientSecret,
        scope: "bot",
    });

    const response = await axios.post("https://auth.worksmobile.com/oauth2/v2.0/token", params);
    const auth = response.data as UserAccountAuthType;

    return auth.access_token;
}

/**
 * Send a message with action to the talk room
 * @param accessToken {string} access token
 * @param botId {string} bot id
 * @param userId {string} user id
 * @param text {string} text message
 */
const sendMessageWithActions = async (
    accessToken: string,
    botId: string,
    userId: string,
    text: string
): Promise<void> => {
    try {
        const headers = {
            Authorization: `Bearer ${accessToken}`
        }

        // const url = `https://www.worksapis.com/v1.0/bots/${botId}/channels/${channelId}/messages`;
        const url = `https://www.worksapis.com/v1.0/bots/${botId}/users/${userId}/messages`;
        
        const response = await axios.post(url, {
            content: {
                type: "text",
                text: text
            }
        }, { headers });
        console.info(response);
    } catch(error) {
        console.error(error);
    }
}

/**
 * Send a request to Claude 3
 * @param secret {SecretType} Secret in environment variables
 * @param text {string} text message
 */
const chatAnthropic = async (secret: SecretType, text: string): Promise<string> => {
    try {
        const model = new ChatAnthropic({
            temperature: 0.9,
            modelName: "claude-3-sonnet-20240229",
            anthropicApiKey: secret.anthropicApiKey,
            maxTokens: 1024,
        });

        // AI に「Excel 数式エキスパート」という役割を与える
        const prompt = ChatPromptTemplate.fromMessages([
            ["system", "Excel 数式エキスパートの役割は、ユーザーが指定した複雑な計算やデータ操作を実行する高度な Excel 数式を提供することです。ユーザーがこの情報を提供しない場合は、Excel で実行したい結果または操作を説明するようユーザーに依頼します。関連するセル範囲、特定の条件、複数の条件、希望する出力形式など、完全な数式を作成するために必要な情報をすべて収集してください。ユーザーの要件を明確に理解したら、目的の結果を達成するための Excel 式の詳細な説明を提供します。式をコンポーネントに分解し、各部分の目的と機能、およびそれらがどのように連携するかを説明します。さらに、Excel ワークシート内で数式を効果的に使用するために必要なコンテキストやヒントを提供します。Excel に関する質問以外には「その質問にはお答えできません。」と回答してください。"],
            ["user", "{input}"],
        ]);

        const chain = prompt.pipe(model);
        const res = await chain.invoke({input: text});
        console.info(res);

        return res.content.toString() ?? "";
    } catch(error) {
        console.error(error);
        
        return "エラーが発生しました。";
    }
}

export { handler };
