export interface Ritual {
  id: number;
  moment: string;
  line: string;
}

export const ritualData: Ritual[] = [
  {
    id: 1,
    moment: "Morning",
    line: "Before the news and before the noise, the first sip of kaapi decides how the day will go.",
  },
  {
    id: 2,
    moment: "Monsoon",
    line: "Rain on the window, steam off the tumbler. Nothing else is required.",
  },
  {
    id: 3,
    moment: "Adda",
    line: "Two cups, one table, and a conversation that ran an hour past the bill.",
  },
  {
    id: 4,
    moment: "Late night",
    line: "Deadline at midnight? The davara has already cooled it just right.",
  },
];
