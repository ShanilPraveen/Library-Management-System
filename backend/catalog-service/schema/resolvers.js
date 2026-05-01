const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

const resolvers = {
    Query: {
        // Get Author Details by ID
        getAuthorById : async (_, {id}) => {
            return await prisma.author.findUnique({
                where: {id},
            });
        },

        // Get All Authors
        getAllAuthors: async () => {
            return await prisma.author.findMany();
        },

        // Search and get Authors by Name
        searchAuthorsByName: async (_, {name}) => {
            return await prisma.author.findMany({
                where: {
                    name: {
                        contains: name,
                        mode: 'insensitive',
                    }
                }
            });
        },

        // Get Book Details by ID   
        getBookById: async (_, {id}) => {
            return await prisma.book.findUnique({
                where: {id},
            });
        },

        // Get All Books
        getAllBooks: async () => {
            return await prisma.book.findMany();
        },

        // Get Total Books Count
        getTotalBooksCount: async () => {
            return await prisma.book.count();
        },

        // Search and get Books by Title
        searchBooksByTitle: async (_, {title}) => {
            return await prisma.book.findMany({
                where:{
                    title:{
                        contains:title,
                        mode:'insensitive',
                    }
                }
            });
        },

        // Search and get Books by Author Name
        searchBooksByAuthorName: async (_, {name}) => {
            return await prisma.book.findMany({
                where: {
                    author: {
                        name: {
                            contains: name,
                            mode: 'insensitive',
                        }
                    }
                }
            });
        },

        // Search Books with Statistics
        searchBooksWithStats: async (_, {query}) => {
            const whereClause = query ? {
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    { author: { name: { contains: query, mode: 'insensitive' } } }
                ]
            } : {};
            
            const books = await prisma.book.findMany({
                where: whereClause,
                include: { author: true },
                take: 100 
            });
            
            // For each book, calculate totalCopies, availableCopies, and damagedCopies
            const booksWithStats = await Promise.all(
                books.map(async (book) => {
                    const [totalCopies, availableCopies, damagedCopies] = await Promise.all([
                        prisma.bookCopy.count({ where: { bookId: book.id } }),
                        prisma.bookCopy.count({ 
                            where: { bookId: book.id, isAvailable: true, isDamaged: false } 
                        }),
                        prisma.bookCopy.count({ where: { bookId: book.id, isDamaged: true } })
                    ]);
                    
                    return {
                        ...book,
                        totalCopies,
                        availableCopies,
                        damagedCopies
                    };
                })
            );
            
            return booksWithStats;
        },


        // Get Books by Author ID
        getBooksByAuthorId: async (_, {authorId}) => {
            return await prisma.book.findMany({
                where: {authorId},
            });
        },

        // Get Book Copy Details by ID
        getBookCopyById: async (_, {id}) => {
            return await prisma.bookCopy.findUnique({
                where: {id},
            });
        },

        // Get All Book Copies for a Book
        getAllBookCopiesByBookId: async (_, {bookId}) => {
            return await prisma.bookCopy.findMany({
                where: {bookId},
            });
        },

        // Get Available Book Copies for a Book
        getAvailableBookCopiesByBookId: async (_, {bookId}) => {
            return await prisma.bookCopy.findMany({
                where:{
                    bookId,
                    isAvailable:true
                }
            })
        },

        // Get All Book Copies
        getAllBookCopies: async ()=>{
            return await prisma.bookCopy.findMany();
        },

        // Get Total Book Copies Count
        getTotalBookCopiesCount: async () => {
            return await prisma.bookCopy.count();
        },

        // Get Book Data by Book Copy ID
        getBookDataByBookCopyId: async (_, {bookCopyId}) => {
            const bookCopy =  await prisma.bookCopy.findUnique({
                where: {id: bookCopyId},});
            if(!bookCopy) return null;
            return await prisma.book.findUnique({
                where: {id: bookCopy.bookId},
            });
        },

        // Get All New Book Requests
        getAllNewBookRequests: async () => {
            return await prisma.newBookRequest.findMany();
        },

        // Get New Book Requests by Status
        getAllNewBookRequestsByStatus: async (_, {status}) => {
            return await prisma.newBookRequest.findMany({
                where: {status},
            });
        }
    },

    Mutation: {
        // Create an Author by name
        createAuthor: async (_,{name})=>{
            return await prisma.author.create({
                data:{name}
            });
        },

        // Update an Author's name by ID
        updateAuthor: async (_,{id,name})=>{
            return await prisma.author.update({
                where:{id},
                data:{name}
            });
        },

        // Delete an Author by ID
        deleteAuthor: async (_,{id})=>{
            await prisma.author.delete({
                where:{id}
            });
            return true;
        },

        // Create a Book with input details
        createBook: async (_,{input})=>{
            return await prisma.book.create({
                data:input
            });
        },

        // Update a Book's details by ID
        updateBook: async (_,{id,input})=>{
            return await prisma.book.update({
                where:{id},
                data:input
            });
        },

        // Delete a Book by ID
        deleteBook: async (_,{id})=>{
            const associatedCopies = await prisma.bookCopy.findMany({
                where:{bookId:id}
            });

            // Delete associated book copies first
            if(associatedCopies.length > 0){
                for (const copy of associatedCopies){
                    await prisma.bookCopy.delete({
                        where:{id:copy.id}
                    });
                }
            }

            await prisma.book.delete({
                where:{id}
            });
            
            return true;
        },

        // Create a Book Copy for a BookId
        createBookCopy: async (_,{bookId})=>{
            return await prisma.bookCopy.create({
                data:{bookId}
            });
        },

        // Bulk Create Book Copies for a BookId
        createBookCopies: async (_,{bookId, count})=>{
            const bookCopiesData = [];
            for(let i=0;i<count;i++){
                const copy = await prisma.bookCopy.create({
                    data:{bookId}
                });
                bookCopiesData.push(copy);
            }
            return bookCopiesData;
        },

        // Delete a Book Copy by ID
        deleteBookCopy: async (_,{id})=>{
            await prisma.bookCopy.delete({
                where:{id}
            });
            return true;
        },

        // Mark Book Copy as Available
        markCopyAsAvailable: async (_,{id})=>{
            return await prisma.bookCopy.update({
                where:{id},
                data:{isAvailable:true}
            });
        },

        // Mark Book Copy as Unavailable
        markCopyAsUnavailable: async (_,{id})=>{
            return await prisma.bookCopy.update({
                where:{id},
                data:{isAvailable:false}
            });
        },

        // Mark Book Copy as Damaged
        markCopyAsDamaged: async (_,{id})=>{
            return await prisma.bookCopy.update({
                where:{id},
                data:{isDamaged:true, isAvailable:false}
            });
        },

        // Create a New Book Request with input details
        createNewBookRequest: async (_,{input})=>{
            return await prisma.newBookRequest.create({
                data:input
            });
        },
        // Update New Book Request Status by ID
        updateNewBookRequestStatus: async (_,{id,status})=>{
            return await prisma.newBookRequest.update({
                where:{id},
                data:{status}
            });
        }
            
        
    },


    // Relationship Resolvers
    Author:{
        books:async (parent)=>{
            return await prisma.book.findMany({
                where:{authorId:parent.id}
            });
        },
        __resolveReference: async (reference) => {
            return await prisma.author.findUnique({
                where: {id: reference.id},
            });
        }

    },
    Book:{
        author:async (parent)=>{
            return await prisma.author.findUnique({
                where:{id:parent.authorId}
            });
        },
        copies:async (parent)=>{
            return await prisma.bookCopy.findMany({
                where:{bookId:parent.id}
            });
        },
        __resolveReference: async (reference) => {
            return await prisma.book.findUnique({
                where: {id: reference.id},
            });
        }
    },
    BookCopy:{
        book:async (parent)=>{
            return await prisma.book.findUnique({
                where:{id:parent.bookId}
            });
        },
        __resolveReference: async (reference) => {
            return await prisma.bookCopy.findUnique({
                where: {id: reference.id},
            });
        }
    },
    NewBookRequest:{
        user:async (parent)=>{
            if(!parent.userId) return null;
            return {
                __typename: "User",
                id: parent.userId
            };
        }
    }

};

module.exports = resolvers;