# Gemini-Guess
“Gemini Guess” is an open-ended game where players challenge Gemini 3 to guess any idea via text, voice, or video, replaying its deep, multi-turn reasoning and thought process.

## Inspiration

Inspired by how kids (and anyone) love guessing games, we wanted to explore how far AI can reason in open-ended challenges. Gemini 3’s deep, multi-turn reasoning made it perfect for testing curiosity and creativity.

## What it does

Players think of any concept, object, or idea — or even say it aloud or show it visually. Gemini 3 tries to guess it through deep reasoning, while the app tracks rounds, scores, and lets users replay the AI’s thought process in text, voice, and video.

## How we built it

* Built as a Next.js web app for quick hackathon demo
* Gemini 3 API powers the reasoning and multi-turn guessing
* Web APIs handle microphone and camera input for voice/video
* Game state stored in memory (or lightweight database) to track top rounds
* Replays rendered visually and with audio playback for judges

## Challenges we ran into

* Designing prompts for unlimited concepts so Gemini guesses reasonably
* Handling voice & video input without latency
* Keeping the game fun but fair, so AI sometimes fails in interesting ways
* Managing multi-turn reasoning for replay in a concise format

## Accomplishments that we're proud of

* Showcased Gemini 3’s reasoning depth and nuance
* Created a replayable game that visualizes AI thought process
* Enabled voice, video, and text inputs in a single app
* Made an interactive experience that works for anyone, not just kids

## What we learned

* Gemini 3 can handle deep, multi-turn reasoning across open-ended challenges
* Multimodal input (voice/video) makes AI interaction more natural
* Designing prompts for AI is an art as well as a science
* Replaying AI thinking is as fun as playing the game itself

## What's next for Gemini Guess

* Add leaderboards and global scoring
* Expand video/voice AI interaction, maybe live-stream challenges
* Optimize prompts for faster AI guesses without losing nuance
* Mobile-friendly version (React Native) for on-the-go play
