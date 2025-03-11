require("dotenv").config();
const { Client } = require("@notionhq/client");
const cron = require("node-cron");

// Initialize Notion client
const notion = new Client({ auth: process.env.NOTION_API_KEY });

// Replace with your database ID
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

// Function to reset the counter
async function resetCounter() {
    try {
        // Fetch all pages in the database
        const response = await notion.databases.query({
            database_id: DATABASE_ID,
        });

        // Loop through each page and update the counter to 0
        for (const page of response.results) {
            await notion.pages.update({
                page_id: page.id,
                properties: {
                    "Frequency/Week": {
                        number: 0, // Set counter to 0
                    },
                },
            });
            console.log(`Counter reset for page: ${page.id}`);
        }

        console.log("✅ Weekly counter reset successfully!");
    } catch (error) {
        console.error("❌ Error resetting counter:", error);
    }
}

resetCounter()
