import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Grade enum mapping (A=0, B=1, C=2, D=3, F=4 from EF Core)
enum Grade {
    A = 0,
    B = 1,
    C = 2,
    D = 3,
    F = 4,
}

async function main() {
    console.log('🌱 Seeding database...');

    // Clear existing data in correct order (respect FK constraints)
    await prisma.enrollment.deleteMany();
    await prisma.officeAssignment.deleteMany();
    await prisma.course.deleteMany();
    await prisma.department.deleteMany();
    await prisma.instructor.deleteMany();
    await prisma.student.deleteMany();

    console.log('✨ Creating students...');
    const alexander = await prisma.student.create({
        data: {
            FirstMidName: 'Carson',
            LastName: 'Alexander',
            EnrollmentDate: new Date('2016-09-01'),
        },
    });

    const alonso = await prisma.student.create({
        data: {
            FirstMidName: 'Meredith',
            LastName: 'Alonso',
            EnrollmentDate: new Date('2018-09-01'),
        },
    });

    const anand = await prisma.student.create({
        data: {
            FirstMidName: 'Arturo',
            LastName: 'Anand',
            EnrollmentDate: new Date('2019-09-01'),
        },
    });

    const barzdukas = await prisma.student.create({
        data: {
            FirstMidName: 'Gytis',
            LastName: 'Barzdukas',
            EnrollmentDate: new Date('2018-09-01'),
        },
    });

    const li = await prisma.student.create({
        data: {
            FirstMidName: 'Yan',
            LastName: 'Li',
            EnrollmentDate: new Date('2018-09-01'),
        },
    });

    const justice = await prisma.student.create({
        data: {
            FirstMidName: 'Peggy',
            LastName: 'Justice',
            EnrollmentDate: new Date('2017-09-01'),
        },
    });

    const norman = await prisma.student.create({
        data: {
            FirstMidName: 'Laura',
            LastName: 'Norman',
            EnrollmentDate: new Date('2019-09-01'),
        },
    });

    const olivetto = await prisma.student.create({
        data: {
            FirstMidName: 'Nino',
            LastName: 'Olivetto',
            EnrollmentDate: new Date('2011-09-01'),
        },
    });

    console.log('✨ Creating instructors...');
    const abercrombie = await prisma.instructor.create({
        data: {
            FirstMidName: 'Kim',
            LastName: 'Abercrombie',
            HireDate: new Date('1995-03-11'),
        },
    });

    const fakhouri = await prisma.instructor.create({
        data: {
            FirstMidName: 'Fadi',
            LastName: 'Fakhouri',
            HireDate: new Date('2002-07-06'),
        },
    });

    const harui = await prisma.instructor.create({
        data: {
            FirstMidName: 'Roger',
            LastName: 'Harui',
            HireDate: new Date('1998-07-01'),
        },
    });

    const kapoor = await prisma.instructor.create({
        data: {
            FirstMidName: 'Candace',
            LastName: 'Kapoor',
            HireDate: new Date('2001-01-15'),
        },
    });

    const zheng = await prisma.instructor.create({
        data: {
            FirstMidName: 'Roger',
            LastName: 'Zheng',
            HireDate: new Date('2004-02-12'),
        },
    });

    console.log('✨ Creating office assignments...');
    await prisma.officeAssignment.createMany({
        data: [
            { InstructorID: fakhouri.ID, Location: 'Smith 17' },
            { InstructorID: harui.ID, Location: 'Gowan 27' },
            { InstructorID: kapoor.ID, Location: 'Thompson 304' },
        ],
    });

    console.log('✨ Creating departments...');
    const english = await prisma.department.create({
        data: {
            Name: 'English',
            Budget: 350000,
            StartDate: new Date('2007-09-01'),
            InstructorID: abercrombie.ID,
            version: 1,
        },
    });

    const mathematics = await prisma.department.create({
        data: {
            Name: 'Mathematics',
            Budget: 100000,
            StartDate: new Date('2007-09-01'),
            InstructorID: fakhouri.ID,
            version: 1,
        },
    });

    const engineering = await prisma.department.create({
        data: {
            Name: 'Engineering',
            Budget: 350000,
            StartDate: new Date('2007-09-01'),
            InstructorID: harui.ID,
            version: 1,
        },
    });

    const economics = await prisma.department.create({
        data: {
            Name: 'Economics',
            Budget: 100000,
            StartDate: new Date('2007-09-01'),
            InstructorID: kapoor.ID,
            version: 1,
        },
    });

    console.log('✨ Creating courses with manual IDs...');
    // Chemistry - 1050
    const chemistry = await prisma.course.create({
        data: {
            CourseID: 1050,
            Title: 'Chemistry',
            Credits: 3,
            DepartmentID: engineering.DepartmentID,
            Instructors: {
                connect: [{ ID: kapoor.ID }, { ID: harui.ID }],
            },
        },
    });

    // Microeconomics - 4022
    const microeconomics = await prisma.course.create({
        data: {
            CourseID: 4022,
            Title: 'Microeconomics',
            Credits: 3,
            DepartmentID: economics.DepartmentID,
            Instructors: {
                connect: [{ ID: zheng.ID }],
            },
        },
    });

    // Macroeconomics - 4041
    const macroeconomics = await prisma.course.create({
        data: {
            CourseID: 4041,
            Title: 'Macroeconomics',
            Credits: 3,
            DepartmentID: economics.DepartmentID,
            Instructors: {
                connect: [{ ID: zheng.ID }],
            },
        },
    });

    // Calculus - 1045
    const calculus = await prisma.course.create({
        data: {
            CourseID: 1045,
            Title: 'Calculus',
            Credits: 4,
            DepartmentID: mathematics.DepartmentID,
            Instructors: {
                connect: [{ ID: fakhouri.ID }],
            },
        },
    });

    // Trigonometry - 3141
    const trigonometry = await prisma.course.create({
        data: {
            CourseID: 3141,
            Title: 'Trigonometry',
            Credits: 4,
            DepartmentID: mathematics.DepartmentID,
            Instructors: {
                connect: [{ ID: harui.ID }],
            },
        },
    });

    // Composition - 2021
    const composition = await prisma.course.create({
        data: {
            CourseID: 2021,
            Title: 'Composition',
            Credits: 3,
            DepartmentID: english.DepartmentID,
            Instructors: {
                connect: [{ ID: abercrombie.ID }],
            },
        },
    });

    // Literature - 2042
    const literature = await prisma.course.create({
        data: {
            CourseID: 2042,
            Title: 'Literature',
            Credits: 4,
            DepartmentID: english.DepartmentID,
            Instructors: {
                connect: [{ ID: abercrombie.ID }],
            },
        },
    });

    console.log('✨ Creating enrollments...');
    await prisma.enrollment.createMany({
        data: [
            { StudentID: alexander.ID, CourseID: chemistry.CourseID, Grade: Grade.A },
            { StudentID: alexander.ID, CourseID: microeconomics.CourseID, Grade: Grade.C },
            { StudentID: alexander.ID, CourseID: macroeconomics.CourseID, Grade: Grade.B },
            { StudentID: alonso.ID, CourseID: calculus.CourseID, Grade: Grade.B },
            { StudentID: alonso.ID, CourseID: trigonometry.CourseID, Grade: Grade.B },
            { StudentID: alonso.ID, CourseID: composition.CourseID, Grade: Grade.B },
            { StudentID: anand.ID, CourseID: chemistry.CourseID, Grade: null }, // No grade
            { StudentID: anand.ID, CourseID: microeconomics.CourseID, Grade: Grade.B },
            { StudentID: barzdukas.ID, CourseID: chemistry.CourseID, Grade: Grade.B },
            { StudentID: li.ID, CourseID: composition.CourseID, Grade: Grade.B },
            { StudentID: justice.ID, CourseID: literature.CourseID, Grade: Grade.B },
        ],
    });

    console.log('✅ Seeding completed successfully!');
    console.log('');
    console.log('Summary:');
    console.log('  - 8 Students');
    console.log('  - 5 Instructors');
    console.log('  - 3 Office Assignments');
    console.log('  - 4 Departments');
    console.log('  - 7 Courses (manual IDs)');
    console.log('  - 11 Enrollments');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:');
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
