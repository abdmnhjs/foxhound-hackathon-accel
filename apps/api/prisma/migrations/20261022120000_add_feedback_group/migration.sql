CREATE TYPE "FeedbackPriority" AS ENUM ('red', 'yellow', 'green');

CREATE TABLE "feedback_user" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "plan" TEXT,

    CONSTRAINT "feedback_user_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "feedback_result" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "priority" "FeedbackPriority" NOT NULL,
    "contradiction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_result_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "_FeedbackResultToFeedbackUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FeedbackResultToFeedbackUser_AB_pkey" PRIMARY KEY ("A", "B")
);

CREATE INDEX "feedback_user_userId_idx" ON "feedback_user"("userId");
CREATE INDEX "_FeedbackResultToFeedbackUser_B_index" ON "_FeedbackResultToFeedbackUser"("B");

ALTER TABLE "feedback_user" ADD CONSTRAINT "feedback_user_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "_FeedbackResultToFeedbackUser" ADD CONSTRAINT "_FeedbackResultToFeedbackUser_A_fkey"
    FOREIGN KEY ("A") REFERENCES "feedback_result"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_FeedbackResultToFeedbackUser" ADD CONSTRAINT "_FeedbackResultToFeedbackUser_B_fkey"
    FOREIGN KEY ("B") REFERENCES "feedback_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
