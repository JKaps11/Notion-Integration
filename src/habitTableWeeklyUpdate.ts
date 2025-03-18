import 'dotenv/config';
import { Client } from "@notionhq/client";

interface NotionNumberProperty {
  number?: number | null;
}

interface NotionPageProperties {
  [key: string]: NotionNumberProperty;
}

interface NotionPage {
  id: string;
  properties: NotionPageProperties;
}

const notionClient = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = process.env.NOTION_DATABASE_ID as string;

const COLLUMN_TITLE_WEEK_COUNT = "# weeks";
const COLLUMN_TITLE_SUCCESSFUL_WEEKS = "# successful weeks";
const COLLUMN_TITLE_WEEKLY_GOAL = "Frequency/Week Goal";
const COLLUMN_TITLE_WEEKLY_FREQUENCY = "Frequency/Week";
const COLLUMN_TITLE_SUCCESS_PERCENTAGE = "%Success";

const getNumber = (value: number | null | undefined): number => value ?? 0;

async function fetchNotionPages(): Promise<NotionPage[]> {
  const response = await notionClient.databases.query({ database_id: DATABASE_ID });
  return response.results as NotionPage[];
}

function incrementWeekCount(currentCount: number | null | undefined): number {
  return getNumber(currentCount) + 1;
}

function updateSuccessfulWeeks(
  currentSuccessful: number | null | undefined,
  weeklyGoal: number | null | undefined,
  weeklyFrequency: number | null | undefined
): number {
  const current = getNumber(currentSuccessful);
  const goal = getNumber(weeklyGoal);
  const week_amount = getNumber(weeklyFrequency);
  return goal >= week_amount ? current : current + 1;
}

function computeSuccessPercentage(totalWeeks: number, successfulWeeks: number): number {
  return totalWeeks > 0 ? successfulWeeks / totalWeeks : 0;
}

async function updatePageCounters(page: NotionPage): Promise<void> {
  const currentWeekCount = getNumber(page.properties[COLLUMN_TITLE_WEEK_COUNT]?.number);
  const currentSuccessfulWeeks = getNumber(page.properties[COLLUMN_TITLE_SUCCESSFUL_WEEKS]?.number);
  const weeklyGoal = getNumber(page.properties[COLLUMN_TITLE_WEEKLY_GOAL]?.number);
  const weeklyFrequency = getNumber(page.properties[COLLUMN_TITLE_WEEKLY_FREQUENCY]?.number);

  const newWeekCount = incrementWeekCount(currentWeekCount);
  const newSuccessfulWeeks = updateSuccessfulWeeks(currentSuccessfulWeeks, weeklyGoal, weeklyFrequency);
  const newSuccessPercentage = computeSuccessPercentage(newWeekCount, newSuccessfulWeeks);

  // Update table with new values including:
  // Total weeks + 1
  // Total Succesfull weeks Maybe + 1
  // New Percentage of succesfull weeks
  // Recent frequencies
  await notionClient.pages.update({
    page_id: page.id,
    properties: {
      [COLLUMN_TITLE_WEEK_COUNT]: {
        rich_text: [{ text: { content: `${newWeekCount}` } }]
      },
      [COLLUMN_TITLE_SUCCESSFUL_WEEKS]: {
        rich_text: [{ text: { content: `${newSuccessfulWeeks}` } }]
      },
      [COLLUMN_TITLE_SUCCESS_PERCENTAGE]: {
        number: newSuccessPercentage
      },
      [COLLUMN_TITLE_WEEKLY_FREQUENCY]: {
        number: 0 
      }
    }
  });

  console.log(
    `Page ${page.id} updated: Weeks = ${newWeekCount}, Successful Weeks = ${newSuccessfulWeeks}, Success % = ${newSuccessPercentage.toFixed(2)}`
  );
}
async function processAllPages(): Promise<void> {
  try {
    const pages = await fetchNotionPages();
    for (const page of pages) {
      await updatePageCounters(page);
    }
    console.log("Weekly update completed successfully.");
  } catch (error) {
    console.error("Error updating pages:", error);
  }
}

processAllPages();

