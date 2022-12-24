require("dotenv").config({ path: __dirname + "/.env" })
const { twitterClient, twitterBearer } = require("./twitterClient.js")

const delay = seconds =>
  new Promise(resolve => setTimeout(resolve, seconds * 1000))

const tweet = async tweetText => {
  try {
    await twitterClient.v2.tweet(tweetText)
  } catch (e) {
    console.log(e)
  }
}

const getOneTweet = async function (tweetId) {
  const tweet = await twitterClient.v2.singleTweet(tweetId, {
    expansions: "attachments.media_keys",
    "tweet.fields": ["conversation_id"],
  })
  console.log(tweet)
  return tweet
}

const getTweets = async function (query) {
  console.log("==========")
  console.log(`GET_TWEETS with query: ${query}`)
  console.log("==========")
  const response = await twitterClient.v2.search(query, {
    expansions:
      "author_id,attachments.media_keys,entities.mentions.username,in_reply_to_user_id",
    "tweet.fields": ["conversation_id"],
  })
  // console.log(response)

  // tweets
  // console.log(response.data.data)
  return response
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
    "tweet.fields": ["conversation_id"],
  })
}

const checkIfAlreadyReplied = async function (conversation_id, authorId) {
  const search = await getTweets(`conversation_id:${conversation_id}`)
  const tweets = search.data.data
  // console.log(tweets)
  if (search.data.meta.result_count === 0) {
    // console.log(search.data.meta)
    console.log("No conversation")
    return 3
  }
  for (const tw of tweets) {
    // check if the tw in the conversation is from the bot
    if (tw.author_id === process.env.APP_ID) {
      // check if it is a reply to the tw with the authorId from the arguments
      if (tw.in_reply_to_user_id === authorId) {
        // console.log(tw)
        console.log("Already replied!")
        return true
      }
    }
    // else the tw is not from the bot
  }
  console.log("Didn't reply yet!")
  return false
}

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
  console.log("mediaURLS", mediaURLs != undefined && mediaURLs)
  return mediaURLs
}

const replyWithMediaUrls = async function (mediaURLs, tweetId) {
  try {
    let replyText = `Enter this link/s to download your media:\n\n`
    mediaURLs.forEach(url => {
      replyText += `${url}\n`
    })
    console.log(replyText)
    await twitterClient.v2.reply(replyText, tweetId)
    console.log("Replied to tweet")
  } catch (err) {
    // console.log(err)
    console.log(err.data.detail)
  }
  // }
}

module.exports = {
  delay,
  tweet,
  getOneTweet,
  getTweets,
  getMentionedTweets,
  checkIfAlreadyReplied,
  getMediaURLs,
  replyWithMediaUrls,
}
