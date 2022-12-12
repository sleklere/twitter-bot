////////////////
const fs = require("fs")
const https = require("https")

////////////////

require("dotenv").config({ path: __dirname + "/.env" })
const { twitterClient, twitterBearer } = require("./twitterClient.js")
const express = require("express")
const app = express()

app.listen(8000, (req, res) => {
  console.log("Listening. Port 8000")
})

// const clientId = "blJjZ01HcVhUSWtJMF9IVk9wY1I6MTpjaQ";
// const clientSecret = "mWoLK7kR0PdMdRCoPtJOXOqT_XRUBWt75hhkoIqq5oug4vfJ6K";

// const httpRegex =
//   /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;

// Actions
// Search and get tweets with a query text (i.e. @user, photography, 'elon musk')
// const tweets = await twitterClient.v2.search(query, {
//   expansions:
//   "author_id,attachments.media_keys,entities.mentions.username,in_reply_to_user_id",
// });

// Like a tweet (params: app id, tweet id)
// await twitterClient.v2.like(process.env.APP_ID, tweet.id);

// Reply to a tweet (params: content, tweet id)
// await twitterClient.v2.reply("Ok!", tweet.id);

const tweet = async () => {
  try {
    await twitterClient.v2.tweet("Hello world!")
  } catch (e) {
    console.log(e)
  }
}

const getTweets = async function (query) {
  console.log("==========")
  console.log(`GET_TWEETS with query: ${query}`)
  console.log("==========")
  const tweets = await twitterClient.v2.search(query, {
    expansions:
      "author_id,attachments.media_keys,entities.mentions.username,in_reply_to_user_id",
  })
  return tweets
}

const downloadMedia = function (url, fileName) {
  https.get(url, res => {
    // Image will be stored at this path
    const path = `${__dirname}/media/${fileName}`
    const filePath = fs.createWriteStream(path)
    res.pipe(filePath)
    filePath.on("finish", () => {
      filePath.close()
      console.log("Download Completed")
    })
  })
}

const mentionedTweets = async function () {
  const date = new Date("2023-01-01")
  const { data, includes } = await twitterClient.v2.userMentionTimeline(
    "1523649543820267520",
    {
      end_time: date.toISOString(),
      max_results: 8,
      expansions: "author_id,attachments.media_keys,in_reply_to_user_id",
      "media.fields": [
        "alt_text",
        "duration_ms",
        "preview_image_url",
        "public_metrics",
        "variants",
        "url",
      ],
    }
  )
  // const tweetsArr = data.data;

  // Downloads the file, depending if it is a GIF or Photo (have to add videos!)
  //////////////////////
  ///// ADD VIDEOS functionality /////
  //////////////////////
  includes.media.forEach(d => {
    // console.log("Media: ", d);
    let fileName
    let mediaUrl
    switch (d.type) {
      case "animated_gif":
        fileName = `${d.media_key}${d.variants[0].url.slice(-4)}`
        mediaUrl = d.variants[0].url
        break
      case "photo":
        fileName = `${d.media_key}${d.url.slice(-4)}`
        mediaUrl = d.url
        break
    }
    downloadMedia(mediaUrl, fileName)
  })
}

// tweet();
// getTweets("@DescargarMedia");
// getTweets("anda para allá bobo");
// searchAndLike();
mentionedTweets()
