# Vision-Judge

**Evaluating Multimodal Large Language Models as Judges for Vision Tasks**: anonymous submission, under double-blind review.

🌐 **Project page:** https://anonymous-44kk.github.io/VisionJudge/ · 🤗 **Dataset:** https://huggingface.co/datasets/Anonymous-44kk/Vision-Judge

Tool-using MLLM agents have to read the outputs of vision tools (boxes, masks, keypoints, depth maps) before acting on them.
How that output is encoded back into the model matters: two encodings of the same prediction can differ by **10–20 pp** in judging accuracy.
Vision-Judge sweeps **49 encodings** over **7 task categories** (1,949 ranked groups, 5,832 candidates, 1,441 images) with **36 MLLM judges**. For each task it gives a recommended encoding order, which we then validate inside tool-using agents.

## Recommended encoding order

The table ranks encodings by median pairwise judging accuracy across judges, on the controlled encoding-analysis subset. **Bold** marks the top encoding and *(base)* marks the typical tool output.

| Task | Recommended order (median accuracy) |
|---|---|
| Object detection | **text `[x1,y1,x2,y2]` in pixels (.618)** › box-only overlay (.59) › box+label overlay *(base)* (.585) › text `[x,y,w,h]` (.58) › separate canvas (.57) |
| Instance segmentation | **colour by instance (.565)** › overlay + labels + dashed box *(base)* (.558) › opacity 100% (.547) › separate canvas (.545) › no box (.537) › down-sampled text / overlay (.535) › polygon text (.533) |
| Semantic segmentation | **down-sampled class-id text matrix (.555)** › separate canvas (.548) › random palette (.518) › overlay α=0.5 + labels *(base)* (.500) |
| Referring segmentation | **separate canvas (.62)** › contour only (.60) › down-sampled separate (.59) › fill + contour (.585) › down-sampled overlay (.585) › overlay + fill *(base)* (.567) › polygon text / opacity 100% / text matrix (.53) |
| Keypoint | **skeleton, colour by instance *(base)* (.555)** › same colour (.55) › part-keyed JSON (.54) › points only (.535) › flat list (.53) › separate canvas (.52) |
| Depth | **plasma *(base)* (.562)** › turbo (.550) › gray (.532) |

When you use these encodings as an agent's tool-output formatter:
- keep the coordinate convention of text encodings (pixel `xyxy`);
- avoid colour-named depth legends when the task's own markers use those colours;
- make sure the rendered output actually reaches the controller.

## Repository

The repository hosts the project page (GitHub Pages, served from the root of `main`). The interactive *Encoding Explorer* on the page shows one tool prediction per task re-rendered in every encoding with the benchmark's own encoders. It cycles through them automatically, and a compare mode lets you drag a seam between two encodings.

```
index.html            project page
assets/app.js         encoding explorer, galleries
assets/data.js        encoding renders manifest (+ format descriptions shown to judges)
assets/results.js     recommended orders and dataset statistics
assets/img/           renders (WebP)
```

## Citation

```bibtex
@inproceedings{visionjudge2027,
  title     = {Evaluating Multi-modal Large Language Models as Judges for Vision Tasks},
  author    = {Anonymous},
  booktitle = {Under review},
  year      = {2027}
}
```
