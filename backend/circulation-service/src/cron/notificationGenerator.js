const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
const {defaultZero} = require('../../utils/constants');

async function generateNotifications() {
    try {
        console.log("Starting notification generation...");
        let notificationsCreated = defaultZero;
        const today = new Date();
        today.setHours(3, 0, 0, 0);

        const tommorow = new Date(today);
        tommorow.setDate(tommorow.getDate() + 1);

        const threeDaysFromNow = new Date(today);
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        const fourDaysFromNow = new Date(today);
        fourDaysFromNow.setDate(fourDaysFromNow.getDate() + 4);

        const dueSoonBorrowings = await prisma.borrowing.findMany({
            where: {
                isReceived: false,
                dueDate:{
                    gte: threeDaysFromNow,
                    lte: fourDaysFromNow
                }
            }
        });

        for (const borrowing of dueSoonBorrowings) {
            await prisma.notification.create({
                data: {
                    userId: borrowing.userId,
                    content: `Your borrowed book is due on ${borrowing.dueDate.toDateString()}.`
                }
            });
            notificationsCreated++;
        }

        const dueTodayBorrowings = await prisma.borrowing.findMany({
            where: {
                isReceived: false,
                dueDate: {
                    gte: today,
                    lt: tommorow
                }
            }
        });

        for (const borrowing of dueTodayBorrowings) {
            await prisma.notification.create({
                data: {
                    userId: borrowing.userId,
                    content: `Your borrowed book is due today.`
                }
            });
            notificationsCreated++;
        }
        console.log(`Notification generation completed. Total notifications created: ${notificationsCreated}`);
    }
    catch (error) {
        console.error("Error during notification generation:", error);
    }
}
module.exports = generateNotifications;