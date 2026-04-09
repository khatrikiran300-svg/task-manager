import { Selector } from 'testcafe';

fixture `Task Manager App`
    .page `http://localhost:3000`;

test('Page loads and shows heading', async t => {
    const heading = Selector('h1');
    await t.expect(heading.exists).ok();
});

test('Tasks are loaded from API', async t => {
    const taskCards = Selector('.task-card');
    await t.wait(2000);
    await t.expect(taskCards.count).gte(1);
});

test('Add task form exists', async t => {
    const form = Selector('#add-form');
    await t.expect(form.exists).ok();
});

test('Can add a new task', async t => {
    const titleInput = Selector('#title');
    const submitBtn = Selector('button[type="submit"]');
    await t
        .typeText(titleInput, 'Test Task from TestCafe')
        .click(submitBtn);
    await t.wait(2000);
    const taskCards = Selector('.task-card');
    await t.expect(taskCards.count).gte(1);
});
