export interface LibraryScript {
  id: string;
  title: string;
  author: string;
  characterCount: number;
  description: string;
  rawText: string;
}

export const scriptLibrary: LibraryScript[] = [
  {
    id: 'coffee-shop',
    title: 'The Wrong Order',
    author: 'OffBook Sample',
    characterCount: 2,
    description: 'A barista and a very indecisive customer.',
    rawText: `THE WRONG ORDER

BARISTA: Hi there! What can I get for you today?
CUSTOMER: I'll have a... a large... hmm. What's good here?
BARISTA: Everything's good here. That's why it's on the menu.
CUSTOMER: Right, right. Okay. I'll have a medium coffee. No wait, large. No, medium.
BARISTA: Medium it is. Anything else?
CUSTOMER: Actually, can I get oat milk?
BARISTA: Sure.
CUSTOMER: And two sugars.
BARISTA: Done.
CUSTOMER: Actually, make it one sugar. I'm trying to be healthier.
BARISTA: One sugar. Got it.
CUSTOMER: You know what, no sugar. I need to commit.
BARISTA: No sugar. Hero.
CUSTOMER: Can I get a name for the order?
BARISTA: I'm the one who asks that.
CUSTOMER: Right, sorry. It's Dave.
BARISTA: Dave. That'll be four fifty.
CUSTOMER: Perfect. Oh, can I also change that to a hot chocolate?
BARISTA: Dave, I am going to need you to leave.`,
  },
  {
    id: 'job-interview',
    title: 'The Interview',
    author: 'OffBook Sample',
    characterCount: 2,
    description: 'A nervous applicant and an unusual interviewer.',
    rawText: `THE INTERVIEW

INTERVIEWER: Come in, come in. Sit wherever you like.
APPLICANT: Thank you. This is a great office.
INTERVIEWER: Is it? I've never noticed. Where do you see yourself in five years?
APPLICANT: Wow, jumping right in. I see myself in a leadership role, contributing to—
INTERVIEWER: Wrong. Next question.
APPLICANT: I'm sorry, wrong?
INTERVIEWER: Too rehearsed. Say something real.
APPLICANT: Okay. Honestly? In five years I hope I actually like my job.
INTERVIEWER: Now we're talking. What's your greatest weakness?
APPLICANT: I sometimes take on too much work.
INTERVIEWER: That's not a weakness, that's a humblebrag. Try again.
APPLICANT: I panic when people change plans at the last minute.
INTERVIEWER: Excellent. Do you have any questions for me?
APPLICANT: Is this how all your interviews go?
INTERVIEWER: Only the good ones. You're hired.
APPLICANT: Just like that?
INTERVIEWER: You answered a question honestly. That's incredibly rare.`,
  },
  {
    id: 'moving-day',
    title: 'Moving Day',
    author: 'OffBook Sample',
    characterCount: 3,
    description: 'Three roommates discover the couch will not fit.',
    rawText: `MOVING DAY

ACT I

ALEX: Okay, we just need to tilt it.
JORDAN: We've tilted it. It doesn't tilt.
ALEX: Everything tilts. That's physics.
MORGAN: I measured the door. The couch is four inches too wide.
JORDAN: You measured the door after we carried it up three flights of stairs?
MORGAN: I measured it now. Hindsight is a thing.
ALEX: What if we take the legs off?
JORDAN: The couch doesn't have legs, Alex.
ALEX: The door! Take the door off its hinges.
MORGAN: That's actually not a bad idea.
JORDAN: It's a terrible idea and also a great idea. I hate this.
ALEX: Together on three. One, two—
MORGAN: Wait, are we lifting on three or after three?
JORDAN: After. Always after.
ALEX: Some families say on three.
MORGAN: Which family?
ALEX: Chaotic families.
JORDAN: Can we please just move the couch?
MORGAN: Fine. After three. One, two, three.
ALEX: It fit!
JORDAN: It absolutely did not fit, and yet here we are.
MORGAN: That's basically how all moving works.`,
  },
  {
    id: 'escape-room',
    title: 'The Escape Room',
    author: 'OffBook Sample',
    characterCount: 3,
    description: 'Three friends disagree about how to escape.',
    rawText: `THE ESCAPE ROOM

SAM: Okay we have forty minutes. Let's be systematic.
RILEY: I already solved the first puzzle.
SAM: You've been in here for thirty seconds.
RILEY: I work fast.
CASEY: There's a note under the rug. It says "not under the rug."
SAM: That's the puzzle. It's meta.
RILEY: The code is 1234. I'm trying 1234.
SAM: It's never 1234.
RILEY: It was 1234.
SAM: Absolutely not.
RILEY: The door just clicked. It was 1234.
CASEY: I found a key. I don't know what it opens.
SAM: Label it, set it aside, we'll come back to it.
CASEY: I already used it. It opened a box. The box had another key.
SAM: You can't just—there's a method!
RILEY: Sam, we're escaping the room, not writing a thesis.
CASEY: There's a message on the wall behind that painting.
SAM: What does it say?
CASEY: "You've been doing great." That's it.
SAM: That's encouraging and also useless.
RILEY: Twenty minutes left. How are we doing?
SAM: I genuinely don't know.
CASEY: I think we've escaped three rooms. I've lost track.`,
  },
];
