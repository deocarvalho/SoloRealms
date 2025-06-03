export interface NextStep {
  Description: string;
  Code: string;
}

export type Entry = {
  Code: string;
  Text: string[];
  NextSteps: NextStep[];
  image?: string; // Optional base64 image
};

export interface StartingPoint {
  Code: string;
  Text: string[];
  NextSteps: NextStep[];
}

export interface Adventure {
  StartingPoint: StartingPoint;
  Entries: Entry[];
}

export interface Book {
  Id: string;
  Title: string;
  Authors: string[];
  Credits: string[];
  Adventure: Adventure;
} 