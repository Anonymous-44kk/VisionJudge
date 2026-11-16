# Vision-Judge

**Evaluating Multimodal Large Language Models as Judges for Vision Tasks**: anonymous submission, under double-blind review.

🌐 **Project page:** https://anonymous-44kk.github.io/VisionJudge/ · 🤗 **Dataset:** https://huggingface.co/datasets/Anonymous-44kk/Vision-Judge

Tool-using MLLM agents have to read the outputs of vision tools (boxes, masks, keypoints, depth maps) before acting on them.
How that output is encoded back into the model matters: two encodings of the same prediction can differ by up to **19 pp** in judging accuracy.
Vision-Judge evaluates **33 MLLM judges** over **8 task families** (1,750 ranked instances, 5,259 candidates, 1,302 input images from 24 datasets) and sweeps **38 encodings**. For each task it gives a recommended encoding order, which we then test inside tool-using agents.

## Recommended encoding order

The table ranks encodings by median pairwise judging accuracy across the 11 judges of the controlled encoding-analysis subset (7,311 questions). **Bold** marks the top encoding and *(base)* marks the typical tool output.

| Task | Recommended order (median accuracy) |
|---|---|
| Object detection | **Labeled boxes on image *(base)* (.767)** › Unlabeled boxes on image (.767) › [x₁, y₁, x₂, y₂] (text) (.721) › Boxes on black image (.709) › [x, y, w, h] (text) (.651) |
| Instance segmentation | **Masks on black image (.779)** › Per-instance colors (.772) › Overlay without boxes (.768) › Overlay, α = 0.5 *(base)* (.765) › Binary grid on image (.740) › Binary grid (text) (.734) › Overlay without labels (.723) › Binary grid on black image (.720) › Polygon (text) (.671) |
| Semantic segmentation | **Overlay, α = 0.5 *(base)* (.594)** › Labeled mask on black image (.587) › Class-ID grid (text) (.568) › Class-ID grid on image (.516) › Low-res mask on black image (.516) |
| Referring segmentation | **Outline only (.747)** › Mask on black image (.713) › Filled mask + outline (.678) › Overlay, α = 0.5 *(base)* (.661) › Opaque overlay (α = 1) (.633) › Binary grid (text) (.609) › Binary grid on black image (.595) › Binary grid on image (.595) › Polygon (text) (.554) |
| Keypoint | **Part-keyed JSON (text) (.725)** › Skeleton on black image (.725) › Per-instance colors *(base)* (.714) › Flat coordinate list (text) (.670) › Skeleton on image (.648) › Single-color skeleton (.637) › Joints only (no limbs) (.571) |
| Depth | **Grayscale (.742)** › Plasma colormap *(base)* (.742) › Turbo colormap (.719) |

In tool-using agents (SpAgent, ViperGPT, ReVPT):
- Vision-Judge accuracy predicts accuracy on CV-Bench with tools (r = 0.90 across 10 controllers);
- encoding preferences transfer where judging separates encodings clearly, and can be model-specific: a controller whose own judging departs from the average (Qwen2.5-VL-72B prefers `[x1, y1, x2, y2]` text for detection) follows its own preference;
- near-ties in judging (label size, depth colormaps) give no reliable agent difference.

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
