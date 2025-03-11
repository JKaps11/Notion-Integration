require("dotenv").config();
const { Client } = require("@notionhq/client");

const notionClient = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

const PROP_WEEK_COUNT = "# weeks";
const PROP_SUCCESSFUL_WEEKS = "# successful weeks";
const PROP_WEEKLY_GOAL = "Frequency/Week Goal";
const PROP_WEEKLY_FREQUENCY = "Frequency/Week";
const PROP_SUCCESS_PERCENTAGE = "%Success";

async function fetchNotionPages() {
  const response = await notionClient.databases.query({ database_id: DATABASE_ID });
  return response.results;
}

function incrementWeekCount(currentCount) {
  return (currentCount || 0) + 1;
}

function updateSuccessfulWeeks(currentSuccessful, weeklyGoal, weeklyFrequency) {
  return (weeklyGoal >= weeklyFrequency ? (currentSuccessful || 0) + 1 : (currentSuccessful || 0));
}

function computeSuccessPercentage(totalWeeks, successfulWeeks) {
  return totalWeeks > 0 ? (successfulWeeks / totalWeeks) * 100 : 0;
}

async function updatePageCounters(page) {
  const currentWeekCount = page.properties[PROP_WEEK_COUNT].number;
  const currentSuccessfulWeeks = page.properties[PROP_SUCCESSFUL_WEEKS].number;
  const weeklyGoal = page.properties[PROP_WEEKLY_GOAL].number;
  const weeklyFrequency = page.properties[PROP_WEEKLY_FREQUENCY].number;

  const newWeekCount = incrementWeekCount(currentWeekCount);
  const newSuccessfulWeeks = updateSuccessfulWeeks(currentSuccessfulWeeks, weeklyGoal, weeklyFrequency);
  const newSuccessPercentage = computeSuccessPercentage(newWeekCount, newSuccessfulWeeks);

  await notionClient.pages.update({
    page_id: page.id,
    properties: {
      [PROP_WEEK_COUNT]: { number: newWeekCount },
      [PROP_SUCCESSFUL_WEEKS]: { number: newSuccessfulWeeks },
      [PROP_SUCCESS_PERCENTAGE]: { number: newSuccessPercentage },
    },
  });

  console.log(
    `Page ${page.id} updated: Weeks = ${newWeekCount}, Successful Weeks = ${newSuccessfulWeeks}, Success % = ${newSuccessPercentage.toFixed(2)}`
  );
}

async function processAllPages() {
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

