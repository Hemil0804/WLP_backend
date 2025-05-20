const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const Question = require('./../models/question.model');
const constants = require("../../config/constants")

mongoose.connect('mongodb://localhost:27017/wlp-backend-local', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Could not connect to MongoDB', err);
});

let quationsArray = [
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "What is your age?",
        "mcqOptions": [
            { "name": "a", "description": "18-24" },
            { "name": "b", "description": "25-34" },
            { "name": "c", "description": "35-44" },
            { "name": "d", "description": "45-54" },
            { "name": "e", "description": "55-64" },
            { "name": "f", "description": "65 or older" }
        ]
    },
    {
        "questionBy": 1, "questionType": 1,
        "questionTitle": "What is your gender?",
        "mcqOptions": [
            { "name": "a", "description": "Male" },
            { "name": "b", "description": "Female" },
            { "name": "c", "description": "Non-binary" },
            { "name": "d", "description": "Prefer not to answer" }
        ]
    },
    {
        "questionBy": 1, "questionType": 1,
        "questionTitle": "What is your race/ethnicity?",
        "mcqOptions": [
            { "name": "a", "description": "White" },
            { "name": "b", "description": "Black or African American" },
            { "name": "c", "description": "Hispanic or Latino" },
            { "name": "d", "description": "Asian or Pacific Islander" },
            { "name": "e", "description": "American Indian or Alaskan Native" },
            { "name": "f", "description": "Other" },
            { "name": "g", "description": "Prefer not to answer" }
        ]
    },
    {
        "questionBy": 1, "questionType": 1,
        "questionTitle": "What is your highest level of education completed?",
        "mcqOptions": [
            { "name": "a", "description": "High school or less" },
            { "name": "b", "description": "Some college" },
            { "name": "c", "description": "Bachelor’s degree" },
            { "name": "d", "description": "Master’s degree or higher" }
        ]
    },
    {
        "questionBy": 1, "questionType": 1,
        "questionTitle": "What is your current employment status?",
        "mcqOptions": [
            { "name": "a", "description": "Employed full-time" },
            { "name": "b", "description": "Employed part-time" },
            { "name": "c", "description": "Unemployed" },
            { "name": "d", "description": "Retired" },
            { "name": "e", "description": "Student" },
            { "name": "f", "description": "Other" }
        ]
    },
    {
        "questionBy": 1, "questionType": 1,
        "questionTitle": "Which political party do you typically support?",
        "mcqOptions": [
            { "name": "a", "description": "Democratic Party" },
            { "name": "b", "description": "Republican Party" },
            { "name": "c", "description": "Libertarian Party" },
            { "name": "d", "description": "Green Party" },
            { "name": "e", "description": "Independent" },
            { "name": "f", "description": "Other" }
        ]
    },
    {
        "questionBy": 1, "questionType": 1,
        "questionTitle": "What is your opinion on the current state of the economy?",
        "mcqOptions": [
            { "name": "a", "description": "Excellent" },
            { "name": "b", "description": "Good" },
            { "name": "c", "description": "Fair" },
            { "name": "d", "description": "Poor" },
            { "name": "e", "description": "Terrible" }
        ]
    },
    {
        "questionBy": 1, "questionType": 1,
        "questionTitle": "How concerned are you about the national debt?",
        "mcqOptions": [
            { "name": "a", "description": "Very concerned" },
            { "name": "b", "description": "Somewhat concerned" },
            { "name": "c", "description": "Not very concerned" },
            { "name": "d", "description": "Not concerned at all" }
        ]
    },
    {
        "questionBy": 1, "questionType": 1,
        "questionTitle": "How important is the issue of healthcare to you?",
        "mcqOptions": [
            { "name": "a", "description": "Extremely important" },
            { "name": "b", "description": "Very important" },
            { "name": "c", "description": "Somewhat important" },
            { "name": "d", "description": "Not very important" },
            { "name": "e", "description": "Not important at all" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "Should the government provide universal healthcare?",
        "mcqOptions": [
            { "name": "a", "description": "Yes" },
            { "name": "b", "description": "No" },
            { "name": "c", "description": "Don’t know" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "What is your opinion on the current immigration policy?",
        "mcqOptions": [
            { "name": "a", "description": "Too Strict" },
            { "name": "b", "description": "About right" },
            { "name": "c", "description": "Too lenient" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "Should the government provide a path to citizenship for illegal immigrants?",
        "mcqOptions": [
            { "name": "a", "description": "Yes" },
            { "name": "b", "description": "No" },
            { "name": "c", "description": "Don’t know" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "What is your stance on gun control?",
        "mcqOptions": [
            { "name": "a", "description": "Support stricter gun control laws" },
            { "name": "b", "description": "Support current gun control laws" },
            { "name": "c", "description": "Oppose stricter gun control laws" },
            { "name": "d", "description": "Don’t know" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "Should there be limits on the number of guns an individual can own?",
        "mcqOptions": [
            { "name": "a", "description": "Yes" },
            { "name": "b", "description": "No" },
            { "name": "c", "description": "Don’t know" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "What is your opinion on the death penalty?",
        "mcqOptions": [
            { "name": "a", "description": "Support" },
            { "name": "b", "description": "Oppose" },
            { "name": "c", "description": "Don’t know" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "Should abortion be legal?",
        "mcqOptions": [
            { "name": "a", "description": "Yes, in all cases" },
            { "name": "b", "description": "Yes, in some cases" },
            { "name": "c", "description": "No, in all cases" },
            { "name": "d", "description": "Don’t know" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "What is your opinion on same-sex marriage?",
        "mcqOptions": [
            { "name": "a", "description": "Support" },
            { "name": "b", "description": "Oppose" },
            { "name": "c", "description": "Don’t know" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "What is your stance on climate change?",
        "mcqOptions": [
            { "name": "a", "description": "A serious problem that requires immediate action" },
            { "name": "b", "description": "A problem that requires action, but not immediately" },
            { "name": "c", "description": "A minor problem that does not require immediate action" },
            { "name": "d", "description": "Not a problem" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "Should the government invest in renewable energy sources?",
        "mcqOptions": [
            { "name": "a", "description": "Yes" },
            { "name": "b", "description": "No" },
            { "name": "c", "description": "Don’t know" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "What is your opinion on the Paris Climate Agreement?",
        "mcqOptions": [
            { "name": "a", "description": "Support" },
            { "name": "b", "description": "Oppose" },
            { "name": "c", "description": "Don’t know" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "How important are civil rights to you?",
        "mcqOptions": [
            { "name": "a", "description": "Very important" },
            { "name": "b", "description": "Somewhat important" },
            { "name": "c", "description": "Not very important" },
            { "name": "d", "description": "Not at all important" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "Should the United States continue to support NATO?",
        "mcqOptions": [
            { "name": "a", "description": "Yes" },
            { "name": "b", "description": "No" },
            { "name": "c", "description": "Neutral" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "What is your opinion on foreign aid?",
        "mcqOptions": [
            { "name": "a", "description": "Support foreign aid" },
            { "name": "b", "description": "Oppose foreign aid" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "Should the government provide subsidies for renewable energy?",
        "mcqOptions": [
            { "name": "a", "description": "Yes" },
            { "name": "b", "description": "No" },
            { "name": "c", "description": "Neutral" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "How important is infrastructure to you?",
        "mcqOptions": [
            { "name": "a", "description": "Very important" },
            { "name": "b", "description": "Somewhat important" },
            { "name": "c", "description": "Not very important" },
            { "name": "d", "description": "Not at all important" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "Should the government increase taxes on the wealthy?",
        "mcqOptions": [
            { "name": "a", "description": "Yes" },
            { "name": "b", "description": "No" },
            { "name": "c", "description": "Neutral" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "What is your opinion on government regulation of businesses?",
        "mcqOptions": [
            { "name": "a", "description": "Support government regulation of businesses" },
            { "name": "b", "description": "Oppose government regulation of businesses" },
            { "name": "c", "description": "Neutral" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "Should there be limits on campaign spending?",
        "mcqOptions": [
            { "name": "a", "description": "Yes" },
            { "name": "b", "description": "No" },
            { "name": "c", "description": "Neutral" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "What is your stance on the legalization of marijuana?",
        "mcqOptions": [
            { "name": "a", "description": "Support legalization of marijuana" },
            { "name": "b", "description": "Oppose legalization of marijuana" },
            { "name": "c", "description": "Neutral" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "How important is education to you?",
        "mcqOptions": [
            { "name": "a", "description": "Very important" },
            { "name": "b", "description": "Somewhat important" },
            { "name": "c", "description": "Not very important" },
            { "name": "d", "description": "Not at all important" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "What is your stance on income inequality?",
        "mcqOptions": [
            { "name": "a", "description": "Support policies to reduce income inequality" },
            { "name": "b", "description": "Oppose policies to reduce income inequality" },
            { "name": "c", "description": "Neutral" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "What is your opinion on affirmative action?",
        "mcqOptions": [
            { "name": "a", "description": "Support affirmative action" },
            { "name": "b", "description": "Oppose affirmative action" },
            { "name": "c", "description": "Neutral" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "Should there be a minimum wage?",
        "mcqOptions": [
            { "name": "a", "description": "Yes" },
            { "name": "b", "description": "No" },
            { "name": "c", "description": "Neutral" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "What is your opinion on Social Security?",
        "mcqOptions": [
            { "name": "a", "description": "Social Security is an important program that should be expanded" },
            { "name": "b", "description": "Social Security is a flawed program that needs to be reformed or eliminated" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "Should the United States have a policy of non-interventionism?",
        "mcqOptions": [
            { "name": "a", "description": "Yes, the US should focus on domestic issues and avoid involvement in foreign conflicts" },
            { "name": "b", "description": "No, the US has a responsibility to promote democracy and protect human rights around the world" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "What is your stance on the war on drugs?",
        "mcqOptions": [
            { "name": "a", "description": "The war on drugs has been ineffective and harmful, and drug addiction should be treated as a public health issue" },
            { "name": "b", "description": "The war on drugs is necessary to reduce drug use and drug-related crime" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "How important is the issue of privacy to you?",
        "mcqOptions": [
            { "name": "a", "description": "Extremely important" },
            { "name": "b", "description": "Very important" },
            { "name": "c", "description": "Somewhat important" },
            { "name": "d", "description": "Not very important" },
            { "name": "e", "description": "Not at all important" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "Should the United States continue to support Israel?",
        "mcqOptions": [
            { "name": "a", "description": "Yes, Israel is an important ally in the Middle East and a bastion of democracy" },
            { "name": "b", "description": "No, US support for Israel undermines US relations with other countries in the region and perpetuates the Israeli-Palestinian conflict" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "What is your opinion on the use of drones for targeted killings?",
        "mcqOptions": [
            { "name": "a", "description": "The use of drones for targeted killings is necessary to combat terrorism and protect national security" },
            { "name": "b", "description": "The use of drones for targeted killings is a violation of international law and human rights" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "Should the US continue to maintain a military presence in Afghanistan?",
        "mcqOptions": [
            { "name": "a", "description": "Yes, a US military presence is necessary to prevent the resurgence of the Taliban and to protect US interests in the region" },
            { "name": "b", "description": "No, the US should withdraw its troops and let the Afghan government handle its own security" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "What is your opinion on the US’s relationship with Russia?",
        "mcqOptions": [
            { "name": "a", "description": "The US should work to improve its relationship with Russia to reduce tensions and promote global stability" },
            { "name": "b", "description": "The US should take a tougher stance against Russia to deter its aggressive behavior and protect US interests" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "Should the US government regulate social media platforms to address misinformation?",
        "mcqOptions": [
            { "name": "a", "description": "Yes, social media platforms have a responsibility to regulate content that is false or harmful" },
            { "name": "b", "description": "No, social media platforms should be allowed to operate without government interference" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "Should the US government provide free college education?",
        "mcqOptions": [
            { "name": "a", "description": "Yes, a free college education is necessary to promote social mobility and provide opportunities for all" },
            { "name": "b", "description": "No, a free college education is not necessary and would be a burden on taxpayers" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "Should the US government continue to support the military-industrial complex?",
        "mcqOptions": [
            { "name": "a", "description": "Yes, the military-industrial complex is necessary for national defense and job creation" },
            { "name": "b", "description": "No, the military-industrial complex is a wasteful and corrupt system that harms the economy and society" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "Should the US government increase funding for public education?",
        "mcqOptions": [
            { "name": "a", "description": "Yes, increased funding for public education is necessary to ensure that all students have access to quality education" },
            { "name": "b", "description": "No, increased funding for public education is not necessary and would be a waste of taxpayer money" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "What is your stance on government funding for the arts?",
        "mcqOptions": [
            { "name": "a", "description": "The government should increase funding for the arts to promote culture and creativity in society" },
            { "name": "b", "description": "The government should decrease funding for the arts and allow the private sector to support artistic endeavors" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "Should the government increase or decrease funding for scientific research?",
        "mcqOptions": [
            { "name": "a", "description": "Increase funding for scientific research to promote innovation and advancements in various fields" },
            { "name": "b", "description": "Decrease funding for scientific research to reduce the budget deficit and focus on other priorities" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "What is your opinion on the use of military force to resolve international conflicts?",
        "mcqOptions": [
            { "name": "a", "description": "Military force is sometimes necessary to protect national interests and promote peace and stability" },
            { "name": "b", "description": "The use of military force should be avoided as much as possible and diplomatic solutions should be prioritized" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "Should the government increase or decrease spending on law enforcement and the criminal justice system?",
        "mcqOptions": [
            { "name": "a", "description": "Increase spending on law enforcement and the criminal justice system to promote public safety and protect communities" },
            { "name": "b", "description": "Decrease spending on law enforcement and the criminal justice system to address issues of police brutality and systemic racism" }
        ]
    },
    {
        "questionType": 1,
        "questionBy": 1,
        "questionTitle": "What is your opinion on the use of torture in the interrogation of suspected terrorists?",
        "mcqOptions": [
            { "name": "a", "description": "The use of torture is never acceptable and violates basic human rights" },
            { "name": "b", "description": "The use of torture may be necessary in extreme cases to obtain critical information and protect national security" }
        ]
    }
]

// function getRandomQuestionType() {
//     const types = Object.values(constants.QUESTION_TYPE);
//     return types[Math.floor(Math.random() * types.length)];
// }

// function getMCQmcqOptions() {
//     return [
//         { name: 'A', description: faker.lorem.sentence(), isCorrect: false },
//         { name: 'B', description: faker.lorem.sentence(), isCorrect: false },
//         { name: 'C', description: faker.lorem.sentence(), isCorrect: false },
//         { name: 'D', description: faker.lorem.sentence(), isCorrect: false },
//     ];
// }

// function getTrueFalsemcqOptions() {
//     return [
//         { name: 'A', description: true, isCorrect: false },
//         { name: 'B', description: false, isCorrect: false },
//     ];
// }

// function generateQuestions(numberOfQuestions) {
//     const questions = [];

//     for (let i = 0; i < numberOfQuestions; i++) {
//         const questionType = getRandomQuestionType();
//         let mcqmcqOptions = [];

//         if (questionType === constants.QUESTION_TYPE.MCQ) {
//             mcqmcqOptions = getMCQmcqOptions();
//             // Randomly set one option as correct
//             mcqmcqOptions[Math.floor(Math.random() * mcqmcqOptions.length)].isCorrect = true;
//         } else if (questionType === constants.QUESTION_TYPE.YES_NO) {
//             mcqmcqOptions = getTrueFalsemcqOptions();
//             // Randomly set one option as correct
//             mcqmcqOptions[Math.floor(Math.random() * mcqmcqOptions.length)].isCorrect = true;
//         }

//         const question = {
//             questionTitle: faker.lorem.sentence(),
//             mcqmcqOptions,
//             status: constants.STATUS.ACTIVE,
//             questionType: questionType,
//             createdAt: Date.now(),
//             updatedAt: Date.now()
//         };

//         questions.push(question);
//     }

//     return questions;
// }

async function seedQuestions() {
    // const questions = generateQuestions(250);

    try {
        await Question.insertMany(quationsArray);
        console.log('Seeded 250 questions successfully');
    } catch (error) {
        console.error('Error seeding questions:', error);
    } finally {
        mongoose.connection.close();
    }
}

seedQuestions();
