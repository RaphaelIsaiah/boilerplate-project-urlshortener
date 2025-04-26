# 🔗 URL Shortener Microservice

## A [freeCodeCamp](https://freecodecamp.org) Certification Project

![FCC Badge](https://img.shields.io/badge/freeCodeCamp-Certification%20Project-0A0A23?logo=freecodecamp)  
![Node.js](https://img.shields.io/badge/Node.js-18.x-green?logo=node.js)  
![Express](https://img.shields.io/badge/Express-4.x-lightgrey?logo=express)  
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-teal?logo=mongodb)  
![License](https://img.shields.io/badge/License-MIT-teal)

A high-performance URL shortening service with analytics, built with Node.js and MongoDB. Features custom short codes and social media previews.

![Demo Screenshot](https://i.postimg.cc/pLwm91Rt/URL-Shortener-Microservice.png)

## 🚀 Try It Live

[![Vercel](https://vercel.com/button)](https://boilerplate-project-urlshortener-omega.vercel.app/)

## ⚡ Powered By

[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?logo=vercel&color=134e4a)](https://vercel.com)  
[![Tailwind CSS](https://img.shields.io/badge/Styled%20with-Tailwind_CSS-06B6D4?logo=tailwindcss)](https://tailwindcss.com)

## 🌟 Features

- **One-click shortening** with auto-copy to clipboard
- **Social media-ready** previews (Open Graph tags)
- **REST API** for programmatic access
- **Mobile-optimized** interface

## 🔍 Example Output

```json
{
  "original_url": "https://www.freecodecamp.org/",
  "short_url": "abc123",
  "clicks": 0,
  "createdAt": "2025-06-20T12:00:00Z"
}
```

## 🛠️ API Endpoints

### `POST /api/shorturl`

- **Body**: `{ "url": "https://example.com" }`
- **Returns**: Short URL object (JSON)

### `GET /api/shorturl/:id`

- **Redirects** to original URL
- **Social bots** receive rich previews

### `GET /api/analytics/:id` _(Coming Soon)_

- Returns click statistics

## 🖥️ Local Setup

```bash
git clone https://github.com/RaphaelIsaiah/boilerplate-project-urlshortener
cd boilerplate-project-urlshortener
npm install
echo "MONGODB_URI=mongodb+srv://user:pass@cluster.url.mongodb.net/url_shortener" > .env
npm start
```

_Server runs on `http://localhost:3000`_

## 🌈 Tech Stack

- **Backend**: Node.js + Express
- **Database**: MongoDB Atlas
- **Frontend**: Tailwind CSS
- **Deployment**: Vercel

## 📜 License

MIT © 2025 [Raphael Isaiah](https://github.com/RaphaelIsaiah)

---

✨ **Pro Tip**: Use `?v=2` at the end of short URLs to force social platforms to refresh their preview cache!
