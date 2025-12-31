import { db } from '../src/config/drizzle';
import { students, instructors, departments, courses, enrollments, officeAssignments, courseInstructors } from '../src/db/schema';

// Grade enum mapping (A=0, B=1, C=2, D=3, F=4)
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
    await db.delete(enrollments);
    await db.delete(courseInstructors);
    await db.delete(officeAssignments);
    await db.delete(courses);
    await db.delete(departments);
    await db.delete(instructors);
    await db.delete(students);

    console.log('✨ Creating students...');
    const studentData = [
        { FirstMidName: 'Carson', LastName: 'Alexander', EnrollmentDate: new Date('2016-09-01') },
        { FirstMidName: 'Meredith', LastName: 'Alonso', EnrollmentDate: new Date('2018-09-01') },
        { FirstMidName: 'Arturo', LastName: 'Anand', EnrollmentDate: new Date('2019-09-01') },
        { FirstMidName: 'Gytis', LastName: 'Barzdukas', EnrollmentDate: new Date('2018-09-01') },
        { FirstMidName: 'Yan', LastName: 'Li', EnrollmentDate: new Date('2018-09-01') },
        { FirstMidName: 'Peggy', LastName: 'Justice', EnrollmentDate: new Date('2017-09-01') },
        { FirstMidName: 'Laura', LastName: 'Norman', EnrollmentDate: new Date('2019-09-01') },
        { FirstMidName: 'Nino', LastName: 'Olivetto', EnrollmentDate: new Date('2011-09-01') },
        { FirstMidName: 'Emily', LastName: 'Rodriguez', EnrollmentDate: new Date('2020-09-01') },
        { FirstMidName: 'James', LastName: 'Martinez', EnrollmentDate: new Date('2019-01-15') },
        { FirstMidName: 'Sophia', LastName: 'Anderson', EnrollmentDate: new Date('2021-09-01') },
        { FirstMidName: 'Michael', LastName: 'Taylor', EnrollmentDate: new Date('2020-01-10') },
        { FirstMidName: 'Emma', LastName: 'Thomas', EnrollmentDate: new Date('2018-09-01') },
        { FirstMidName: 'William', LastName: 'Jackson', EnrollmentDate: new Date('2017-09-01') },
        { FirstMidName: 'Olivia', LastName: 'White', EnrollmentDate: new Date('2021-01-15') },
        { FirstMidName: 'Benjamin', LastName: 'Harris', EnrollmentDate: new Date('2019-09-01') },
        { FirstMidName: 'Ava', LastName: 'Martin', EnrollmentDate: new Date('2020-09-01') },
        { FirstMidName: 'Lucas', LastName: 'Thompson', EnrollmentDate: new Date('2018-01-10') },
        { FirstMidName: 'Isabella', LastName: 'Garcia', EnrollmentDate: new Date('2021-09-01') },
        { FirstMidName: 'Mason', LastName: 'Martinez', EnrollmentDate: new Date('2017-01-15') },
        { FirstMidName: 'Mia', LastName: 'Robinson', EnrollmentDate: new Date('2020-09-01') },
        { FirstMidName: 'Ethan', LastName: 'Clark', EnrollmentDate: new Date('2019-01-10') },
        { FirstMidName: 'Charlotte', LastName: 'Lewis', EnrollmentDate: new Date('2021-01-15') },
        { FirstMidName: 'Alexander', LastName: 'Lee', EnrollmentDate: new Date('2018-09-01') },
        { FirstMidName: 'Amelia', LastName: 'Walker', EnrollmentDate: new Date('2020-01-10') },
        { FirstMidName: 'Daniel', LastName: 'Hall', EnrollmentDate: new Date('2019-09-01') },
        { FirstMidName: 'Harper', LastName: 'Allen', EnrollmentDate: new Date('2021-09-01') },
        { FirstMidName: 'Matthew', LastName: 'Young', EnrollmentDate: new Date('2017-09-01') },
        { FirstMidName: 'Evelyn', LastName: 'King', EnrollmentDate: new Date('2020-09-01') },
        { FirstMidName: 'Henry', LastName: 'Wright', EnrollmentDate: new Date('2018-01-15') },
    ];

    const insertedStudents = await db.insert(students).values(studentData).returning();
    const [alexander, alonso, anand, barzdukas, li, justice, norman, olivetto] = insertedStudents;

    console.log('✨ Creating instructors...');
    const instructorData = [
        { FirstMidName: 'Kim', LastName: 'Abercrombie', HireDate: new Date('1995-03-11') },
        { FirstMidName: 'Fadi', LastName: 'Fakhouri', HireDate: new Date('2002-07-06') },
        { FirstMidName: 'Roger', LastName: 'Harui', HireDate: new Date('1998-07-01') },
        { FirstMidName: 'Candace', LastName: 'Kapoor', HireDate: new Date('2001-01-15') },
        { FirstMidName: 'Roger', LastName: 'Zheng', HireDate: new Date('2004-02-12') },
        { FirstMidName: 'Sarah', LastName: 'Johnson', HireDate: new Date('2010-08-20') },
        { FirstMidName: 'David', LastName: 'Smith', HireDate: new Date('2008-03-15') },
        { FirstMidName: 'Jennifer', LastName: 'Brown', HireDate: new Date('2012-06-10') },
        { FirstMidName: 'Robert', LastName: 'Davis', HireDate: new Date('2005-09-25') },
        { FirstMidName: 'Lisa', LastName: 'Wilson', HireDate: new Date('2015-01-12') },
    ];

    const insertedInstructors = await db.insert(instructors).values(instructorData).returning();
    const [abercrombie, fakhouri, harui, kapoor, zheng, johnson, smith, brown, davis, wilson] = insertedInstructors;

    console.log('✨ Creating office assignments...');
    await db.insert(officeAssignments).values([
        { InstructorID: fakhouri.ID, Location: 'Smith 17' },
        { InstructorID: harui.ID, Location: 'Gowan 27' },
        { InstructorID: kapoor.ID, Location: 'Thompson 304' },
        { InstructorID: johnson.ID, Location: 'Carson 215' },
        { InstructorID: brown.ID, Location: 'Miller 108' },
        { InstructorID: davis.ID, Location: 'Science 402' },
        { InstructorID: wilson.ID, Location: 'Arts 305' },
    ]);

    console.log('✨ Creating departments...');
    const [english] = await db.insert(departments).values({
        Name: 'English',
        Budget: 350000,
        StartDate: new Date('2007-09-01'),
        InstructorID: abercrombie.ID,
        version: 1,
    }).returning();

    const [mathematics] = await db.insert(departments).values({
        Name: 'Mathematics',
        Budget: 100000,
        StartDate: new Date('2007-09-01'),
        InstructorID: fakhouri.ID,
        version: 1,
    }).returning();

    const [engineering] = await db.insert(departments).values({
        Name: 'Engineering',
        Budget: 350000,
        StartDate: new Date('2007-09-01'),
        InstructorID: harui.ID,
        version: 1,
    }).returning();

    const [economics] = await db.insert(departments).values({
        Name: 'Economics',
        Budget: 100000,
        StartDate: new Date('2007-09-01'),
        InstructorID: kapoor.ID,
        version: 1,
    }).returning();

    console.log('✨ Creating courses with manual IDs...');
    const courseData = [
        { CourseID: 1050, Title: 'Chemistry', Credits: 3, DepartmentID: engineering.DepartmentID },
        { CourseID: 4022, Title: 'Microeconomics', Credits: 3, DepartmentID: economics.DepartmentID },
        { CourseID: 4041, Title: 'Macroeconomics', Credits: 3, DepartmentID: economics.DepartmentID },
        { CourseID: 1045, Title: 'Calculus', Credits: 4, DepartmentID: mathematics.DepartmentID },
        { CourseID: 3141, Title: 'Trigonometry', Credits: 4, DepartmentID: mathematics.DepartmentID },
        { CourseID: 2021, Title: 'Composition', Credits: 3, DepartmentID: english.DepartmentID },
        { CourseID: 2042, Title: 'Literature', Credits: 4, DepartmentID: english.DepartmentID },
        { CourseID: 1060, Title: 'Physics', Credits: 4, DepartmentID: engineering.DepartmentID },
        { CourseID: 1070, Title: 'Biology', Credits: 3, DepartmentID: engineering.DepartmentID },
        { CourseID: 2030, Title: 'Creative Writing', Credits: 3, DepartmentID: english.DepartmentID },
        { CourseID: 2050, Title: 'Poetry', Credits: 2, DepartmentID: english.DepartmentID },
        { CourseID: 3150, Title: 'Linear Algebra', Credits: 4, DepartmentID: mathematics.DepartmentID },
        { CourseID: 3160, Title: 'Statistics', Credits: 3, DepartmentID: mathematics.DepartmentID },
        { CourseID: 4050, Title: 'International Economics', Credits: 3, DepartmentID: economics.DepartmentID },
        { CourseID: 4060, Title: 'Development Economics', Credits: 3, DepartmentID: economics.DepartmentID },
    ];

    const insertedCourses = await db.insert(courses).values(courseData).returning();
    const [chemistry, microeconomics, macroeconomics, calculus, trigonometry, composition, literature] = insertedCourses;

    console.log('✨ Assigning instructors to courses...');
    await db.insert(courseInstructors).values([
        { CourseID: chemistry.CourseID, InstructorID: kapoor.ID },
        { CourseID: chemistry.CourseID, InstructorID: harui.ID },
        { CourseID: microeconomics.CourseID, InstructorID: zheng.ID },
        { CourseID: macroeconomics.CourseID, InstructorID: zheng.ID },
        { CourseID: calculus.CourseID, InstructorID: fakhouri.ID },
        { CourseID: trigonometry.CourseID, InstructorID: harui.ID },
        { CourseID: composition.CourseID, InstructorID: abercrombie.ID },
        { CourseID: literature.CourseID, InstructorID: abercrombie.ID },
    ]);

    console.log('✨ Creating enrollments...');
    const enrollmentData = [
        { StudentID: insertedStudents[0].ID, CourseID: 1050, Grade: Grade.A },
        { StudentID: insertedStudents[0].ID, CourseID: 4022, Grade: Grade.C },
        { StudentID: insertedStudents[0].ID, CourseID: 4041, Grade: Grade.B },
        { StudentID: insertedStudents[1].ID, CourseID: 1045, Grade: Grade.B },
        { StudentID: insertedStudents[1].ID, CourseID: 3141, Grade: Grade.B },
        { StudentID: insertedStudents[1].ID, CourseID: 2021, Grade: Grade.B },
        { StudentID: insertedStudents[2].ID, CourseID: 1050, Grade: null },
        { StudentID: insertedStudents[2].ID, CourseID: 4022, Grade: Grade.B },
        { StudentID: insertedStudents[3].ID, CourseID: 1050, Grade: Grade.B },
        { StudentID: insertedStudents[4].ID, CourseID: 2021, Grade: Grade.B },
        { StudentID: insertedStudents[5].ID, CourseID: 2042, Grade: Grade.B },
        { StudentID: insertedStudents[6].ID, CourseID: 1045, Grade: Grade.A },
        { StudentID: insertedStudents[6].ID, CourseID: 3150, Grade: Grade.A },
        { StudentID: insertedStudents[7].ID, CourseID: 2042, Grade: Grade.C },
        { StudentID: insertedStudents[8].ID, CourseID: 1060, Grade: Grade.B },
        { StudentID: insertedStudents[8].ID, CourseID: 1070, Grade: Grade.A },
        { StudentID: insertedStudents[9].ID, CourseID: 3141, Grade: Grade.C },
        { StudentID: insertedStudents[10].ID, CourseID: 2030, Grade: Grade.A },
        { StudentID: insertedStudents[11].ID, CourseID: 4050, Grade: Grade.B },
        { StudentID: insertedStudents[11].ID, CourseID: 4060, Grade: Grade.B },
        { StudentID: insertedStudents[12].ID, CourseID: 1050, Grade: Grade.C },
        { StudentID: insertedStudents[13].ID, CourseID: 3160, Grade: Grade.A },
        { StudentID: insertedStudents[14].ID, CourseID: 2050, Grade: Grade.B },
        { StudentID: insertedStudents[15].ID, CourseID: 1045, Grade: Grade.B },
        { StudentID: insertedStudents[16].ID, CourseID: 2021, Grade: null },
        { StudentID: insertedStudents[17].ID, CourseID: 4022, Grade: Grade.A },
        { StudentID: insertedStudents[18].ID, CourseID: 1070, Grade: Grade.B },
        { StudentID: insertedStudents[19].ID, CourseID: 3141, Grade: Grade.C },
        { StudentID: insertedStudents[20].ID, CourseID: 2042, Grade: Grade.A },
        { StudentID: insertedStudents[21].ID, CourseID: 1050, Grade: Grade.B },
        { StudentID: insertedStudents[22].ID, CourseID: 4041, Grade: Grade.A },
        { StudentID: insertedStudents[23].ID, CourseID: 3150, Grade: Grade.B },
        { StudentID: insertedStudents[24].ID, CourseID: 2030, Grade: null },
        { StudentID: insertedStudents[25].ID, CourseID: 1060, Grade: Grade.C },
        { StudentID: insertedStudents[26].ID, CourseID: 3160, Grade: Grade.A },
        { StudentID: insertedStudents[27].ID, CourseID: 4050, Grade: Grade.B },
    ];

    await db.insert(enrollments).values(enrollmentData);

    console.log('✅ Seeding completed successfully!');
    console.log('');
    const courseInstructorData = [
        { CourseID: 1050, InstructorID: kapoor.ID },
        { CourseID: 1050, InstructorID: harui.ID },
        { CourseID: 4022, InstructorID: zheng.ID },
        { CourseID: 4041, InstructorID: zheng.ID },
        { CourseID: 1045, InstructorID: fakhouri.ID },
        { CourseID: 3141, InstructorID: harui.ID },
        { CourseID: 2021, InstructorID: abercrombie.ID },
        { CourseID: 2042, InstructorID: abercrombie.ID },
        { CourseID: 1060, InstructorID: harui.ID },
        { CourseID: 1070, InstructorID: johnson.ID },
        { CourseID: 2030, InstructorID: brown.ID },
        { CourseID: 2050, InstructorID: brown.ID },
        { CourseID: 3150, InstructorID: fakhouri.ID },
        { CourseID: 3160, InstructorID: smith.ID },
        { CourseID: 4050, InstructorID: davis.ID },
        { CourseID: 4060, InstructorID: wilson.ID },
    ];

    await db.insert(courseInstructors).values(courseInstructorData);

    console.log('✅ Seeding completed successfully!');
    console.log('');
    console.log('Summary:');
    console.log('  - 30 Students');
    console.log('  - 10 Instructors');
    console.log('  - 7 Office Assignments');
    console.log('  - 4 Departments');
    console.log('  - 15 Courses (manual IDs)');
    console.log('  - 36 Enrollments');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:');
        console.error(e);
        process.exit(1);
    })
    .finally(() => {
        process.exit(0);
    });
