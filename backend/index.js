const express = require('express');
const fs = require('fs-extra');
const matter = require('gray-matter');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors({
  origin: ['https://xodidsmlek.github.io','http://192.168.0.116:3000'] // 또는 '*'로 모든 도메인 허용
}));

const POSTS_DIR = path.join(__dirname, 'posts');

// 모든 게시글 목록 가져오기
app.get('/posts', async (req, res) => {
  console.log("Received request for /posts");
  try {
    const files = await fs.readdir(POSTS_DIR);
    const posts = await Promise.all(
      files.map(async (file) => {
        const content = await fs.readFile(path.join(POSTS_DIR, file), 'utf-8');
        const { data } = matter(content);
        return { ...data, slug: file.replace('.md', '') };
      })
    );
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error reading posts');
  }
});

// 특정 게시글 내용 가져오기
app.get('/posts/:slug', async (req, res) => {
  const slug = req.params.slug;
  try {
    const filePath = path.join(POSTS_DIR, `${slug}.md`);
    const content = await fs.readFile(filePath, 'utf-8');
    const { data, content: body } = matter(content);
    res.json({ ...data, content: body });
  } catch (err) {
    console.error(err);
    res.status(404).send('Post not found');
  }
});

app.listen(4000, () => {
  console.log('✅ Server running on http://localhost:4000');
});