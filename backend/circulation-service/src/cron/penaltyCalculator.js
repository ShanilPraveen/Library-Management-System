const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
const {penaltyPerDay,defaultZero,miliSecondsInDay} = require('../../utils/constants');

async function calculatePenalties() {
    try{
        console.log("Starting penalty calculation...");
        const today = new Date();
        today.setHours(22, 0, 0, 0);

        // Fetch borrowings that are overdue and not yet received
        const overdueBorrowings = await prisma.borrowing.findMany({
            where: {
                isReceived: false,
                dueDate: { lt: today },
                renewalStatus:{
                    notIn: ['PENDING', 'ACCEPTED']
                }
            }
        });

        let penaltiesCreated = defaultZero;
        let penaltiesUpdated = defaultZero;

        for (const borrowing of overdueBorrowings) {
            let overdueStartDate;
            if (borrowing.renewalStatus === 'REJECTED' && borrowing.decidedDate) {
                overdueStartDate = borrowing.decidedDate;
            } else {
                overdueStartDate = borrowing.dueDate;
            }

            const overdueDays = Math.floor((today - overdueStartDate) / miliSecondsInDay);
            if (overdueDays > 0) {
                const penaltyAmount = overdueDays * penaltyPerDay;
                const result = await prisma.penalty.upsert({
                    where: {
                        borrowingId_reason: {
                            borrowingId: borrowing.id,
                            reason: 'Overdue'
                        }
                    },
                    update: {
                        amount: penaltyAmount
                    },
                    create: {
                        userId: borrowing.userId,
                        borrowingId: borrowing.id,
                        amount: penaltyAmount,
                        reason: 'Overdue',
                        isPaid: false
                    }
                });
                if (result.createdAt.toDateString() === today.toDateString()) {
                    penaltiesCreated++;
                } else {
                    penaltiesUpdated++;
                }
                
            }
        }
        console.log(`Penalty calculation completed. Created: ${penaltiesCreated}, Updated: ${penaltiesUpdated}`);

    }
    catch (error){
        console.error("Error during penalty calculation:", error);
    }
}

module.exports = calculatePenalties;