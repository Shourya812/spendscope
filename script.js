// ========== 1. DATA AND DOM ELEMENTS ==========

// The one place where all transactions live
let transactions = [];
// Remembers which transaction was just added, so only that row flashes
let lastAddedId = null;
let editingTransactionId = null;

// Form and its inputs
const form = document.getElementById("transaction-form");
const titleInput = document.getElementById("title");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const descriptionInput = document.getElementById("description");

// Places where we will show data
const transactionList = document.getElementById("transaction-list");
const emptyMessage = document.getElementById("empty-message");
const totalIncomeEl = document.getElementById("total-income");
const totalExpensesEl = document.getElementById("total-expenses");
const totalBalanceEl = document.getElementById("total-balance");
const totalCountEl = document.getElementById("total-count");
const addButton = document.getElementById("add-btn");
const cancelEditButton = document.getElementById("cancel-edit-btn");

// ========== CHART ELEMENTS ==========

const categoryChartCanvas = document.getElementById("category-chart");

let categoryChart = null;

const incomeExpenseCanvas = document.getElementById("income-expense-chart");
let incomeExpenseChart = null;

const monthlyCanvas = document.getElementById("monthly-chart");
let monthlyChart = null;

const highestExpenseElement =
    document.getElementById("stat-highest-expense");

const averageExpenseElement =
    document.getElementById("stat-average-expense");

const topCategoryElement =
    document.getElementById("stat-top-category");

// Search, filters and sorting
const searchInput = document.getElementById("search-input");
const filterTypeSelect = document.getElementById("filter-type");
const filterCategorySelect = document.getElementById("filter-category");
const sortSelect = document.getElementById("sort-date");

// ========== LOCAL STORAGE ==========

function saveTransactions() {
  localStorage.setItem("spendscope-transactions", JSON.stringify(transactions));
}

function loadTransactions() {
  const savedTransactions = localStorage.getItem("spendscope-transactions");

  if (savedTransactions !== null) {
    transactions = JSON.parse(savedTransactions);
  }
}

// ========== 2. VALIDATION ==========

function showError(fieldName, message) {
  document.getElementById(`${fieldName}-error`).textContent = message;
}

function clearErrors() {
  const fields = ["title", "amount", "type", "category", "date"];

  fields.forEach(function (field) {
    showError(field, "");
  });
}

function validateForm() {
  clearErrors();
  let isValid = true;

  const title = titleInput.value.trim();

  if (title === "") {
    showError("title", "Please enter a title.");
    isValid = false;
  } else if (title.length < 2) {
    showError("title", "Title must be at least 2 characters.");
    isValid = false;
  }

  if (amountInput.value === "") {
    showError("amount", "Please enter an amount.");
    isValid = false;
  } else if (Number(amountInput.value) <= 0) {
    showError("amount", "Amount must be greater than 0.");
    isValid = false;
  }

  if (typeInput.value === "") {
    showError("type", "Please choose Income or Expense.");
    isValid = false;
  }

  if (categoryInput.value === "") {
    showError("category", "Please choose a category.");
    isValid = false;
  }

  if (dateInput.value === "") {
    showError("date", "Please pick a date.");
    isValid = false;
  }

  return isValid;
}


 // ========== 3. ADDING AND EDITING TRANSACTIONS ==========

function addTransaction() {
    const newTransaction = {
        id: Date.now(),
        title: titleInput.value.trim(),
        amount: Number(amountInput.value),
        type: typeInput.value,
        category: categoryInput.value,
        date: dateInput.value,
        description: descriptionInput.value.trim()
    };

    transactions.push(newTransaction);
    saveTransactions();
    lastAddedId = newTransaction.id;
}

function startEditing(id) {
    const transaction = transactions.find(function (item) {
        return item.id === id;
    });

    if (!transaction) return;

    editingTransactionId = id;

    titleInput.value = transaction.title;
    amountInput.value = transaction.amount;
    typeInput.value = transaction.type;

    const categoryExists = Array.from(categoryInput.options).some(
        function (option) {
            return option.value === transaction.category;
        }
    );

    if (!categoryExists) {
        const option = document.createElement("option");
        option.value = transaction.category;
        option.textContent = transaction.category;
        categoryInput.appendChild(option);
    }

    categoryInput.value = transaction.category;
    dateInput.value = transaction.date;
    descriptionInput.value = transaction.description || "";

    addButton.textContent = "Save Changes";
    cancelEditButton.hidden = false;

    clearErrors();

    form.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

function cancelEditing() {
    editingTransactionId = null;

    form.reset();
    clearErrors();

    addButton.textContent = "Add Transaction";
    cancelEditButton.hidden = true;
}

function updateTransaction() {
    const transaction = transactions.find(function (item) {
        return item.id === editingTransactionId;
    });

    if (!transaction) return;

    transaction.title = titleInput.value.trim();
    transaction.amount = Number(amountInput.value);
    transaction.type = typeInput.value;
    transaction.category = categoryInput.value;
    transaction.date = dateInput.value;
    transaction.description = descriptionInput.value.trim();

    saveTransactions();
    cancelEditing();
}


// ========== 4. CALCULATIONS ==========

function calculateTotalIncome() {
  return transactions
    .filter(function (transaction) {
      return transaction.type === "income";
    })
    .reduce(function (total, transaction) {
      return total + transaction.amount;
    }, 0);
}

function calculateTotalExpenses() {
  return transactions
    .filter(function (transaction) {
      return transaction.type === "expense";
    })
    .reduce(function (total, transaction) {
      return total + transaction.amount;
    }, 0);
}

function calculateBalance() {
  return calculateTotalIncome() - calculateTotalExpenses();
}

function formatMoney(number) {
  return number.toLocaleString("en-IN");
}

function updateSummary() {
  totalIncomeEl.textContent = formatMoney(calculateTotalIncome());
  totalExpensesEl.textContent = formatMoney(calculateTotalExpenses());
  totalBalanceEl.textContent = formatMoney(calculateBalance());
  totalCountEl.textContent = transactions.length;
}

function updateAnalytics() {
    const expenses = transactions.filter(function (transaction) {
        return transaction.type === "expense";
    });

    // 1. Highest Expense
    if (expenses.length === 0) {
        highestExpenseElement.textContent = "₹0";
        averageExpenseElement.textContent = "₹0";
        topCategoryElement.textContent = "-";
        return;
    }

    const highestExpense = Math.max(
        ...expenses.map(function (transaction) {
            return transaction.amount;
        })
    );

    highestExpenseElement.textContent = formatMoney(highestExpense);


    // 2. Average Expense
    const totalExpenses = expenses.reduce(function (total, transaction) {
        return total + transaction.amount;
    }, 0);

    const averageExpense = totalExpenses / expenses.length;

    averageExpenseElement.textContent = formatMoney(averageExpense);


    // 3. Top Spending Category
    const categoryTotals = getCategoryTotals();

    const topCategory = Object.entries(categoryTotals).sort(
        function (a, b) {
            return b[1] - a[1];
        }
    )[0];

    topCategoryElement.textContent =
        topCategory[0] + " (" + formatMoney(topCategory[1]) + ")";
}


// ========== 7. CHART DATA CALCULATIONS ==========

function getCategoryTotals() {

  const categoryTotals = {};

  transactions.forEach(function (transaction) {

    if (transaction.type === "expense") {

      const category = transaction.category;

      categoryTotals[category] =
        (categoryTotals[category] || 0) + transaction.amount;

    }

  });

  return categoryTotals;
}

function getMonthlyTotals() {

    const monthlyTotals = {};

    transactions.forEach(function (transaction) {

        const month = transaction.date.slice(0, 7);

        if (!monthlyTotals[month]) {
            monthlyTotals[month] = {
                income: 0,
                expenses: 0
            };
        }

        if (transaction.type === "income") {
            monthlyTotals[month].income += transaction.amount;
        } else {
            monthlyTotals[month].expenses += transaction.amount;
        }

    });

    return monthlyTotals;
}

function renderIncomeExpenseChart() {

    const monthlyData = getMonthlyTotals();

    const months = Object.keys(monthlyData).sort();

    const incomeAmounts = months.map(function (month) {
        return monthlyData[month].income;
    });

    const expenseAmounts = months.map(function (month) {
        return monthlyData[month].expenses;
    });

    const monthLabels = months.map(function (month) {
        const [year, monthNumber] = month.split("-");

        return new Date(
            Number(year),
            Number(monthNumber) - 1
        ).toLocaleString("en-IN", {
            month: "short",
            year: "numeric"
        });
    });

    if (incomeExpenseChart === null) {

        incomeExpenseChart = new Chart(incomeExpenseCanvas, {

            type: "bar",

            data: {
                labels: monthLabels,

                datasets: [
                    {
                        label: "Income",
                        data: incomeAmounts,
                        backgroundColor: "#6366f1"
                    },
                    {
                        label: "Expenses",
                        data: expenseAmounts,
                        backgroundColor: "#f59e0b"
                    }
                ]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                plugins: {
                    legend: {
                        position: "bottom"
                    }
                },

                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }

        });

    } else {

        incomeExpenseChart.data.labels = monthLabels;
        incomeExpenseChart.data.datasets[0].data = incomeAmounts;
        incomeExpenseChart.data.datasets[1].data = expenseAmounts;

        incomeExpenseChart.update();

    }

}

function renderMonthlySpendingChart() {
    const monthlyTotals = getMonthlyTotals();

    const months = Object.keys(monthlyTotals).sort();

    const monthLabels = months.map(function (month) {
        const [year, monthNumber] = month.split("-");

        return new Date(year, monthNumber - 1).toLocaleString("en-IN", {
            month: "short",
            year: "numeric"
        });
    });

    const expenseValues = months.map(function (month) {
        return monthlyTotals[month].expenses;
    });

    if (monthlyChart) {
        monthlyChart.data.labels = monthLabels;
        monthlyChart.data.datasets[0].data = expenseValues;

        monthlyChart.update();
        return;
    }

    monthlyChart = new Chart(monthlyCanvas, {
        type: "line",

        data: {
            labels: monthLabels,

            datasets: [{
                label: "Monthly Spending",
                data: expenseValues,
                borderColor: "#f59e0b",
                backgroundColor: "rgba(245, 158, 11, 0.15)",
                fill: true,
                tension: 0.3
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    position: "bottom"
                }
            },

            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}




// ========== 8. CATEGORY DOUGHNUT CHART ==========

function renderCategoryChart() {

  const categoryData = getCategoryTotals();

  const labels = Object.keys(categoryData);
  const amounts = Object.values(categoryData);

  if (categoryChart === null) {

    categoryChart = new Chart(categoryChartCanvas, {

      type: "doughnut",

      data: {
        labels: labels,

        datasets: [{
          label: "Expenses",
          data: amounts,
          backgroundColor: [
            "#6366f1",
            "#f59e0b",
            "#10b981",
            "#ef4444",
            "#8b5cf6",
            "#06b6d4",
            "#ec4899",
            "#64748b"
          ],
          borderWidth: 2
        }]
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,

        plugins: {
          legend: {
            position: "bottom"
          }
        }
      }

    });

  } else {

    categoryChart.data.labels = labels;
    categoryChart.data.datasets[0].data = amounts;

    categoryChart.update();

  }

}


// =======ESCAPING HTML========
function escapeHTML(text) {

    text = text.replace(/&/g, "&amp;");
    text = text.replace(/</g, "&lt;");
    text = text.replace(/>/g, "&gt;");
    text = text.replace(/"/g, "&quot;");
    text = text.replace(/'/g, "&#39;");

    return text;
}

// ========== FILTERING, SEARCHING, SORTING ==========

function getVisibleTransactions() {
  const searchText = searchInput.value.trim().toLowerCase();
  const typeChoice = filterTypeSelect.value;
  const categoryChoice = filterCategorySelect.value;

  const result = transactions
    .filter(function (transaction) {
      return transaction.title.toLowerCase().includes(searchText);
    })
    .filter(function (transaction) {
      return typeChoice === "all" || transaction.type === typeChoice;
    })
    .filter(function (transaction) {
      return categoryChoice === "all" || transaction.category === categoryChoice;
    });

  if (sortSelect.value === "newest") {
    result.sort(function (a, b) {
      return b.date.localeCompare(a.date) || b.id - a.id;
    });
  } else {
    result.sort(function (a, b) {
      return a.date.localeCompare(b.date) || a.id - b.id;
    });
  }

  return result;
}

// ========== 5. RENDERING ==========

function renderTransactions() {
  const visibleTransactions = getVisibleTransactions();

  // Case 1: no data at all
  if (transactions.length === 0) {
    transactionList.innerHTML = "";
    emptyMessage.textContent = "No transactions yet. Add your first one above.";
    emptyMessage.style.display = "block";
    return;
  }

  // Case 2: data exists, but nothing matches the search or filters
  if (visibleTransactions.length === 0) {
    transactionList.innerHTML = "";
    emptyMessage.textContent = "No transactions match your search or filters.";
    emptyMessage.style.display = "block";
    return;
  }

  emptyMessage.style.display = "none";

  const rowsHTML = visibleTransactions
    .map(function (transaction) {
      const sign = transaction.type === "income" ? "+" : "-";
      const rowClass = transaction.id === lastAddedId ? "new-row" : "";

      return `
        <tr class="${rowClass}">
          <td>${escapeHTML(transaction.title)}</td>
          <td>${transaction.category}</td>
          <td>${transaction.date}</td>
          <td><span class="badge badge-${transaction.type}">${transaction.type}</span></td>
          <td class="amount-${transaction.type}">${sign}₹${formatMoney(transaction.amount)}</td>
          <td>
            <button class="edit-btn" data-id="${transaction.id}">Edit</button>
            <button class="delete-btn" data-id="${transaction.id}">Delete</button>
          </td>
        </tr>
      `;
    })
    .join("");

  transactionList.innerHTML = rowsHTML;

  // The flash only plays once, right after adding
  lastAddedId = null;
}

// ========== 6. EVENTS AND STARTUP ==========

form.addEventListener("submit", function (event) {
  
  event.preventDefault();

  if (!validateForm()) {
    return;
  }

  if(editingTransactionId!==null){
    updateTransaction();
  }else{
    addTransaction();
    form.reset();
  }

  
  renderTransactions();
  updateSummary();
  renderMonthlySpendingChart();
  renderIncomeExpenseChart();
  renderCategoryChart();
  updateAnalytics();
});

// Delete: one listener on the table body handles every Delete button
transactionList.addEventListener("click", function (event) {

  if (event.target.classList.contains("edit-btn")) {
    const idToEdit = Number(event.target.dataset.id);

    startEditing(idToEdit);
    return;
  }

  if (!event.target.classList.contains("delete-btn")) {
    return;
  }

  const idToDelete = Number(event.target.dataset.id);

  transactions = transactions.filter(function (transaction) {
    return transaction.id !== idToDelete;
  });
  saveTransactions();

  renderTransactions();
  updateSummary();
  renderMonthlySpendingChart();
  renderIncomeExpenseChart();
  renderCategoryChart();
  updateAnalytics();
});

// Search and filters redraw the table as the user types or chooses
searchInput.addEventListener("input", renderTransactions);
filterTypeSelect.addEventListener("change", renderTransactions);
filterCategorySelect.addEventListener("change", renderTransactions);
sortSelect.addEventListener("change", renderTransactions);
cancelEditButton.addEventListener("click", function () {
    cancelEditing();
});

// Load previously saved transactions
loadTransactions();

// Draw the page using saved data
renderTransactions();
updateSummary();
renderMonthlySpendingChart();
renderIncomeExpenseChart();
renderCategoryChart();
updateAnalytics();


