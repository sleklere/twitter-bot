////////////////
const fs = require("fs")
const https = require("https")

const {
  delay,
  tweet,
  getOneTweet,
  getTweets,
  getMentionedTweets,
  checkIfAlreadyReplied,
  getMediaURLs,
  replyWithMediaUrls,
} = require("./utils")
require("dotenv").config({ path: __dirname + "/.env" })
const { twitterClient, twitterBearer } = require("./twitterClient.js")
const express = require("express")

////////////////

const app = express()

app.listen(8000, (req, res) => {
  console.log("Listening. Port 8000")
})

// const clientId = "blJjZ01HcVhUSWtJMF9IVk9wY1I6MTpjaQ";
// const clientSecret = "mWoLK7kR0PdMdRCoPtJOXOqT_XRUBWt75hhkoIqq5oug4vfJ6K";

const init = async function () {
  const tweets = (await getMentionedTweets()).data.data

  for (const tw of tweets) {
    // if replied matches a tw (in the same conversation) that is from the bot and has a 'in_reply_to_user_id' == tweet.author_id it will return true. this means the bot already replied to a tweet from that author tagging the bot.
    const replied = await checkIfAlreadyReplied(
      tw.conversation_id,
      tw.author_id
    )
    if (replied === false) {
      const refTweets = tw.referenced_tweets
      // checks if the tw that tags the bot is a reply
      if (refTweets !== undefined && refTweets[0].type === "replied_to") {
        const mediaURLs = await getMediaURLs(tw.referenced_tweets[0].id)
        // reply to the tweet where the bot was mentioned
        replyWithMediaUrls(mediaURLs, tw.id)
        await delay(10)
      }
    }
  }
}

init()
