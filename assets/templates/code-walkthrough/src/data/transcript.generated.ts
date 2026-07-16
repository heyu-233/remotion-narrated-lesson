export type TranscriptSegment = {
  id: number;
  start: number;
  end: number;
  text: string;
};

export const TRANSCRIPT_LANGUAGE = 'zh';
export const TRANSCRIPT_DURATION = 18;
export const TRANSCRIPT_SEGMENTS: TranscriptSegment[] = [
  {id: 1, start: 0.0, end: 2.3, text: '这一段先说明当前代码结构还有点臃肿。'},
  {id: 2, start: 2.3, end: 4.7, text: '我们先看入口文件 main.py，它只负责调用主流程。'},
  {id: 3, start: 4.7, end: 7.3, text: '接着把检测逻辑抽成一个独立函数。'},
  {id: 4, start: 7.3, end: 9.9, text: '然后给返回结果补上更稳定的规范化步骤。'},
  {id: 5, start: 9.9, end: 12.4, text: '主循环这时候就会明显变轻，只保留调度逻辑。'},
  {id: 6, start: 12.4, end: 14.9, text: '后面我们再逐行讲这一段替换后的关键代码。'},
  {id: 7, start: 14.9, end: 16.8, text: '这里可以看到高亮在动，但镜头应该尽量稳定。'},
  {id: 8, start: 16.8, end: 18.0, text: '最后收尾，并把话题引到下一步开发。'},
];
