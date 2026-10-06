import "dotenv/config";
import express from "express"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"; 
import { createAgent, tool } from "langchain";
import { z } from "zod";

// Ye public folder ke files browser ko serve karega (frontend part)
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// STEP2: Setup LLM for GEMINI  (google)(Ye waiter hai)
const llm = new ChatGoogleGenerativeAI({
  model: "gemini-3.5-flash",
  maxOutputTokens: 1024,
  temperature: 0.2,
  apiKey: process.env.GOOGLE_API_KEY,
});


// STEP3: Tool Restaurant Menu Tool
const getMenuTool = tool(
  async ({ category }) => {
    const menus = {
      breakfast: "Aloo Paratha, Poha, Masala Chai",
      lunch: "Paneer Butter Masala, Dal Fry, Jeera Rice, Roti",
      dinner: "Veg Biryani, Raita, Salad, Gulab Jamun",
    };

    return (
      menus[category.toLowerCase()] ||
      "No menu found for that category."
    );
  },
  {
    name: "getMenu",
    description:
      "Returns today's restaurant menu for breakfast, lunch, or dinner.",
    schema: z.object({
      category: z
        .string()
        .describe("Type of food: breakfast, lunch, or dinner"),
    }),
  }
);


//Restaurant Information Tool
const restaurantInfoTool = tool(
  ({ query }) => {
    const info = {
      hours: "The restaurant is open from 10 AM to 11 PM.",
      address: "123 Main Street, Raipur, Chhattisgarh",
      phone: "+91 9876543210",
      services: "Dine-in, Takeaway and Home Delivery",
    };

    const q = query.toLowerCase();

    if (q.includes("hour") || q.includes("open") || q.includes("close")) {
      return info.hours;
    }

    if (q.includes("address") || q.includes("location")) {
      return info.address;
    }

    if (q.includes("phone") || q.includes("contact")) {
      return info.phone;
    }

    if (q.includes("service") || q.includes("delivery")) {
      return info.services;
    }

    return "Sorry, I don't have information about that.";
  },
  {
    name: "restaurantInfo",
    description:
      "Provides restaurant information such as opening hours, address, phone number and available services.",
    schema: z.object({
      query: z
        .string()
        .describe(
          "What restaurant information the customer wants, such as hours, address, phone or services"
        ),
    }),
  }
);


//step4: CreateAgent + systemprompt (Waiter + Menu)
const agent = createAgent({
  model: llm,
  tools: [getMenuTool, restaurantInfoTool],
  systemPrompt: `
You are a Smart Restaurant AI Assistant.

Rules:
- Always help customers politely.
- Use restaurant tools whenever required.
- If the user asks for breakfast, lunch, or dinner menu,
  use the getMenu tool.
- Don't make up menu items.
- If the user asks about restaurant hours, address, phone, delivery or other restaurant information, use the restaurantInfo tool.
`,
});


// //Step5: just to test the Agent that it is working or not
// const result = await agent.invoke({
//   messages: [
//     {
//       role: "user",
//       content: "Show today's lunch menu",
//     },
//   ],
// });
// console.log(result.messages.at(-1).content);


// STEP1: Then create Server using express.js (restaurant open ho gya)
// const app = express()
// app.get('/', (req, res) => {
//   res.send('Hello World')
// })

// app.listen(3000, () => {
//   console.log('Server is running on http://localhost:3000')
// })

//STEP6: create ChatAPI
const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Chat Route
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    // Check if user entered something
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Message is required",
      });
    }

    const result = await agent.invoke(
      {
        messages: [
          {
            role: "user",
            content: message,
          },
        ],
      },
      {
        recursionLimit: 6,
      }
    );

    const lastMessage = result.messages.at(-1);

    res.json({
      success: true,
      reply: lastMessage?.content || "No response generated.",
    });

  } catch (error) {
    console.error("Agent Error:", error);

    res.status(500).json({
      success: false,
      error: error.message || "Something went wrong.",
    });
  }
});

// Start Server
app.listen(3000, () => {
  console.log("Server is running at http://localhost:3000");
});


// for creating project - need LLM, tool, agent
// for agent - LLM, tool, prompt
// for prompt - system(behaviour guide), human(user Input), AI(scratchpad)