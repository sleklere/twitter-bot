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
      // "duration_ms",
      // "preview_image_url",
      // "public_metrics",
      "variants",
      "url",
    ],
  })
}

const getTweetInReplyTo = function (tweet) {
  if (tweet.referenced_tweets.type === "replied_to") {
    getMediaURLs(tweet.referenced_tweets.id)
  }
}

// Downloads the file, depending if it is a GIF or Photo (have to add videos!)
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
        break
      case "photo":
        fileName = `${d.media_key}${d.url.slice(-4)}`
        mediaUrl = d.url
        break
      case "video":
        fileName = `${d.media_key}.mp4`
        // find the best quality video variant
        mediaUrl = d.variants.reduce((prevVideo, curVideo) => {
          if (curVideo.bit_rate == undefined) {
            return prevVideo
          }
          if (curVideo.bit_rate > prevVideo.bit_rate) {
            return curVideo.url
          }
        })
        break
    }
    allUrls.push(mediaUrl)
    // downloadMedia(mediaUrl, fileName)
  })
  console.log(allUrls)
}

const testTwId = "1605695211035926543"

const getMediaURLs = async function (tweetId) {
  const tweet = await twitterClient.v2.singleTweet(tweetId, {
    expansions: "attachments.media_keys",
    "media.fields": ["variants", "url"],
  })
  const tweetMediaCopy = tweet.includes?.media.slice()
  // console.log(tweet.data.attachments)
  let mediaURLs = tweetMediaCopy?.map(mediaItem => {
    switch (mediaItem.type) {
      case "animated_gif":
        return mediaItem.variants[0].url
      case "photo":
        return mediaItem.url
      case "video":
        // find the best quality video variant
        return mediaItem.variants.reduce((prevVideo, curVideo) => {
          if (curVideo.bit_rate == undefined) {
            return prevVideo
          }
          if (curVideo.bit_rate > prevVideo.bit_rate) {
            return curVideo.url
          }
        })
    }
  })
  // console.log(tweetMediaCopy)
  // if (mediaURLs) console.log(mediaURLs)
  // console.log("mediaURLS", mediaURLs != undefined && mediaURLs)
  return mediaURLs
}

// checks if the tweet entered as an argument is a reply to another tweet,
// if it is, it will get the URL's for the media objects and reply to the tweet
// from the arguments with them
// MISSING FUNCTION FOR CHECKING IF IT ALREADY REPLIED
const replyWithMediaUrls = async function (tweet) {
  const refTweets = tweet.referenced_tweets
  // console.log(refTweets)
  if (refTweets !== undefined && refTweets[0].type === "replied_to") {
    // console.log(refTweets)
    const mediaURLs = await getMediaURLs(refTweets[0].id)
    try {
      let replyText = `Enter this link/s to download your media:\n\n`
      mediaURLs.forEach(url => {
        replyText += `${url}\n`
      })
      console.log(replyText)
      // await twitterClient.v2.reply(replyText, tweet.id)
      console.log("Replied to tweet")
    } catch (err) {
      console.log(err.data.errors)
    }
  }
}

const testFunction = async function () {
  // const { data, includes } = await getMentionedTweets()
  // const tweetsArr = data.data
  const mentionsTimeline = await getMentionedTweets()
  const tweets = mentionsTimeline.data.data
  // console.log(tweets[0].referenced_tweets)
  // console.log(tweets)
  tweets.forEach(tweet => {
    replyWithMediaUrls(tweet)
  })
}

// tweet();
// getTweets("@DescargarMedia");
// getTweets("anda para allá bobo");
// searchAndLike();
testFunction()
// getQuotes()
// manageMedia()
