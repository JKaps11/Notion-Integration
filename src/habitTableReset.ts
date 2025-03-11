import 'dotenv/config';
import { Client } from "@notionhq/client";

interface NotionPageProperties {
  [key: string]: any;
}

interface NotionPage {
  id: string;
  properties: NotionPageProperties;
}

const notionClient = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = process.env.NOTION_DATABASE_ID as string;

const COLLUMN_TITLE_WEEK_COUNT = "# weeks";
const COLLUMN_TITLE_SUCCESSFUL_WEEKS = "# successful weeks";
const COLLUMN_TITLE_SUCCESS_PERCENTAGE = "%Success";

async function fetchPages(): Promise<NotionPage[]> {
  const response = await notionClient.databases.query({ database_id: DATABASE_ID });
  return response.results as NotionPage[];
}

async function resetPageCounters(page: NotionPage): Promise<void> {
  await notionClient.pages.update({
    page_id: page.id,
    properties: {
      [COLLUMN_TITLE_WEEK_COUNT]: { rich_text: [{ text: { content: "0" } }] },
      [COLLUMN_TITLE_SUCCESSFUL_WEEKS]: { rich_text: [{ text: { content: "0" } }] },
      [COLLUMN_TITLE_SUCCESS_PERCENTAGE]: { number: 0 }
    }
  });
  console.log(`Page ${page.id} reset to 0`);
}

async function resetAllCounters(): Promise<void> {
  try {
    const pages = await fetchPages();
    for (const page of pages) {
      await resetPageCounters(page);
    }
    console.log("All pages reset successfully.");
  } catch (error) {
    console.error("Error resetting pages:", error);
  }
}

resetAllCounters();

