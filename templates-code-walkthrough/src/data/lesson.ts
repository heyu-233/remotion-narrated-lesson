export type LessonFile = {
  path: string;
  language: string;
  code: string;
};

export type FocusRange = {
  startLine: number;
  endLine: number;
};

const appYaml = `id: demo-app
name: remotion-code-walkthrough
version: 1.0.0
main: main.py
`;

const mainPy = `import pipeline


pipeline.run_pipeline()
`;

const readme = `# Demo Walkthrough

Replace the sample code states in lesson.ts with your own project files.
`;

const monolithicPipeline = `def run_pipeline(frame):
    gray = to_gray(frame)
    blur = gaussian_blur(gray)
    mask = threshold(blur)

    candidates = find_candidates(mask)
    best = None

    for candidate in candidates:
        if candidate["score"] < 0.65:
            continue
        if best is None or candidate["score"] > best["score"]:
            best = candidate

    if best:
        points = best["points"]
        center = best["center"]
        draw_box(frame, points)
        draw_center(frame, center)

    return frame
`;

const extractedDetector = `def detect_best_candidate(mask):
    candidates = find_candidates(mask)
    best = None

    for candidate in candidates:
        if candidate["score"] < 0.65:
            continue
        if best is None or candidate["score"] > best["score"]:
            best = candidate

    return best


def run_pipeline(frame):
    gray = to_gray(frame)
    blur = gaussian_blur(gray)
    mask = threshold(blur)

    best = detect_best_candidate(mask)
    if best:
        points = best["points"]
        center = best["center"]
        draw_box(frame, points)
        draw_center(frame, center)

    return frame
`;

const normalizedPipeline = `def detect_best_candidate(mask):
    candidates = find_candidates(mask)
    best = None

    for candidate in candidates:
        if candidate["score"] < 0.65:
            continue
        if best is None or candidate["score"] > best["score"]:
            best = candidate

    return best


def normalize_points(points):
    ordered = sorted(points, key=lambda p: (p[1], p[0]))
    return ordered


def run_pipeline(frame):
    gray = to_gray(frame)
    blur = gaussian_blur(gray)
    mask = threshold(blur)

    best = detect_best_candidate(mask)
    if best:
        ordered = normalize_points(best["points"])
        center = best["center"]
        draw_box(frame, ordered)
        draw_center(frame, center)

    return frame
`;

const finalPipeline = `def detect_best_candidate(mask):
    candidates = find_candidates(mask)
    best = None

    for candidate in candidates:
        if candidate["score"] < 0.65:
            continue
        if best is None or candidate["score"] > best["score"]:
            best = candidate

    return best


def normalize_points(points):
    ordered = sorted(points, key=lambda p: (p[1], p[0]))
    return ordered


def compute_center(points):
    xs = [point[0] for point in points]
    ys = [point[1] for point in points]
    return int(sum(xs) / len(xs)), int(sum(ys) / len(ys))


def run_pipeline(frame):
    gray = to_gray(frame)
    blur = gaussian_blur(gray)
    mask = threshold(blur)

    best = detect_best_candidate(mask)
    if best:
        ordered = normalize_points(best["points"])
        center = compute_center(ordered)
        draw_box(frame, ordered)
        draw_center(frame, center)

    return frame
`;

export const lessonCodeStates = {
  appYaml,
  mainPy,
  readme,
  monolithicPipeline,
  extractedDetector,
  normalizedPipeline,
  finalPipeline,
} as const;

export const lessonFiles: LessonFile[] = [
  {
    path: 'app.yaml',
    language: 'yaml',
    code: appYaml,
  },
  {
    path: 'pipeline.py',
    language: 'python',
    code: finalPipeline,
  },
  {
    path: 'main.py',
    language: 'python',
    code: mainPy,
  },
  {
    path: 'README.md',
    language: 'markdown',
    code: readme,
  },
];
