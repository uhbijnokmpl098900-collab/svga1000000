import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import multer from "multer";

async function startServer() {
  const app = express();
  const PORT = 3000;

  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  app.use('/uploads', express.static(uploadsDir));
  app.use(express.json());

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname.replace(/[^a-zA-Z0-9.]/g, '_'));
    }
  });
  const upload = multer({ storage });

  const galleries = new Map<string, any>();

  app.post('/api/upload', upload.array('images', 100), (req: express.Request, res: express.Response): void => {
    const files = req.files as Express.Multer.File[];
    if (!files) {
      res.status(400).json({ error: 'No files uploaded' });
      return;
    }
    const uploadedFiles = files.map(file => ({
      url: `/uploads/${file.filename}`,
      originalName: file.originalname
    }));
    res.json({ files: uploadedFiles });
  });

  app.post('/api/galleries', (req: express.Request, res: express.Response): void => {
    const { images, layout } = req.body;
    const id = Math.random().toString(36).substring(2, 8);
    galleries.set(id, { images, layout });
    res.json({ id });
  });

  app.get('/api/galleries/:id', (req: express.Request, res: express.Response): void => {
    const gallery = galleries.get(req.params.id);
    if (gallery) {
      res.json(gallery);
    } else {
      res.status(404).json({ error: 'Gallery not found' });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: express.Request, res: express.Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
