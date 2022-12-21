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

const getMentionedTweets = async function () {
  const date = new Date("2023-01-01")
  return await twitterClient.v2.userMentionTimeline("1523649543820267520", {
    end_time: date.toISOString(),
    max_results: 12,
    expansions:
      "author_id,attachments.media_keys,in_reply_to_user_id,referenced_tweets.id",
    "media.fields": [
      "alt_text",
      "duration_ms",
      "preview_image_url",
      "public_metrics",
      "variants",
      "url",
    ],
  })
}

const manageMedia = function (mentionedTweets) {
  let allUrls = []
  mentionedTweets.includes.media.forEach(d => {
    // console.log(d)
    let fileName
    let mediaUrl
    switch (d.type) {
      case "animated_gif":
        fileName = `${d.media_key}${d.variants[0].url.slice(-4)}`
        mediaUrl = d.variants[0].url
        // console.log(mediaUrl)
        allUrls.push(mediaUrl)
        break
      case "photo":
        fileName = `${d.media_key}${d.url.slice(-4)}`
        mediaUrl = d.url
        // console.log(mediaUrl)
        allUrls.push(mediaUrl)
        break
      case "video":
        fileName = `${d.media_key}.mp4`
        mediaUrl = d.variants.reduce((prevVideo, curVideo) => {
          if (curVideo.bit_rate == undefined) {
            return prevVideo
          }
          if (curVideo.bit_rate > prevVideo.bit_rate) {
            return curVideo.url
          }
        })
        allUrls.push(mediaUrl)
      // console.log(mediaUrl)
    }
    // downloadMedia(mediaUrl, fileName)
  })
  console.log(allUrls)
}

const testTwId = "1605695211035926543"

const getTweetPhotoUrl = async function (tweetId) {
  const tweetReplied = await twitterClient.v2.singleTweet(tweetId, {
    expansions: "attachments.media_keys",
    "media.fields": "url",
  })
  const tweetMedia = tweetReplied.includes.media
  console.log(tweetMedia)
  let mediaURLs = []
  tweetMedia.forEach(item => mediaURLs.push(item.url))
  return mediaURLs
}

const testFunction = async function () {
  // const { data, includes } = await getMentionedTweets()
  // const tweetsArr = data.data
  const tweets = await getMentionedTweets()

  // console.log(tweetsArr)

  // const testTw = tweetsArr[0]
  // console.log(testTw)
  // console.log(testTw.referenced_tweets)

  // Downloads the file, depending if it is a GIF or Photo (have to add videos!)
  manageMedia(tweets)
}

const getQuotes = async function () {
  const quotes = await twitterClient.v2.quotes({
    expansions: ["author_id"],
    "user.fields": ["username", "url"],
  })
  console.log(quotes)

  // for await (const quote of quotes) {
  //   const quotedTweetAuthor = includes.author(quote)

  //   if (quotedTweetAuthor) {
  //     console.log(
  //       "Quote answer tweet",
  //       quote.id,
  //       "has been made by",
  //       quotedTweetAuthor.username
  //     )
  //   }
  // }
}

// tweet();
// getTweets("@DescargarMedia");
// getTweets("anda para allá bobo");
// searchAndLike();
testFunction()
// getQuotes()

// manageMedia()
