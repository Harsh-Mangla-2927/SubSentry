"use strict";

/* =========================================================
   SUBSENTRY PROFESSIONAL PDF REPORT
   ========================================================= */

function reportCurrency(value) {
    const number = Number(value) || 0;

    return "Rs. " + number.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function reportDate() {
    return new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function cleanText(value) {
    return String(value ?? "")
        .replace(/[^\x20-\x7E]/g, "");
}


/* =========================================================
   GET REAL SUBSENTRY DATA
   ========================================================= */

function getProfessionalReportData() {

    const user = currentUser || {};

    const subscriptions =
        typeof getSubscriptions === "function"
            ? getSubscriptions()
            : [];

    const budget =
        typeof getBudget === "function"
            ? getBudget()
            : {
                monthlyIncome: 0,
                otherExpenses: 0
            };

    let monthlyBurn = 0;

    subscriptions.forEach(subscription => {

        const monthly =
            typeof normalizeMonthlyAmount === "function"
                ? normalizeMonthlyAmount(
                    subscription.amount,
                    subscription.billingCycle
                )
                : Number(subscription.amount) || 0;

        monthlyBurn += monthly;
    });

    const annualCost =
        monthlyBurn * 12;

    const monthlyIncome =
        Number(budget.monthlyIncome) || 0;

    const otherExpenses =
        Number(budget.otherExpenses) || 0;

    const totalExpenses =
        monthlyBurn + otherExpenses;

    const remaining =
        monthlyIncome - totalExpenses;

    const savingsRate =
        monthlyIncome > 0
            ? (remaining / monthlyIncome) * 100
            : 0;

    const categoryTotals = {};

    subscriptions.forEach(subscription => {

        const category =
            subscription.category || "Other";

        const monthly =
            typeof normalizeMonthlyAmount === "function"
                ? normalizeMonthlyAmount(
                    subscription.amount,
                    subscription.billingCycle
                )
                : Number(subscription.amount) || 0;

        categoryTotals[category] =
            (categoryTotals[category] || 0) + monthly;
    });

    const categories =
        Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1]);

    const overlaps =
        typeof detectOverlaps === "function"
            ? detectOverlaps()
            : [];

    return {
        user,
        subscriptions,
        monthlyBurn,
        annualCost,
        monthlyIncome,
        otherExpenses,
        totalExpenses,
        remaining,
        savingsRate,
        categories,
        overlaps
    };
}


/* =========================================================
   PDF GENERATOR
   ========================================================= */

function createProfessionalReport() {

    if (
        !window.jspdf ||
        !window.jspdf.jsPDF
    ) {
        alert(
            "PDF generator is still loading. Please try again."
        );

        return null;
    }

    const {
        jsPDF
    } = window.jspdf;

    const report =
        getProfessionalReportData();

    const doc =
        new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

    const pageWidth =
        doc.internal.pageSize.getWidth();

    const pageHeight =
        doc.internal.pageSize.getHeight();

    const margin = 16;

    const primary = [37, 99, 235];
    const dark = [15, 23, 42];
    const text = [51, 65, 85];
    const muted = [100, 116, 139];
    const light = [241, 245, 249];
    const border = [226, 232, 240];
    const green = [22, 163, 74];
    const red = [220, 38, 38];

    let y = 16;


    /* =====================================================
       BASIC HELPERS
    ===================================================== */

    function resetCharSpacing() {

        if (typeof doc.setCharSpace === "function") {
            doc.setCharSpace(0);
        }
    }


    function addPage() {

        doc.addPage();

        y = 16;

        drawFooter();
    }


    function ensureSpace(height) {

        if (
            y + height >
            pageHeight - 18
        ) {
            addPage();
        }
    }


    function drawFooter() {

        const pageNumber =
            doc.internal.getCurrentPageInfo()
                .pageNumber;

        doc.setDrawColor(
            ...border
        );

        doc.line(
            margin,
            pageHeight - 13,
            pageWidth - margin,
            pageHeight - 13
        );

        resetCharSpacing();

        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.setFontSize(7);

        doc.setTextColor(
            ...muted
        );

        doc.text(
            "SubSentry",
            margin,
            pageHeight - 7
        );

        doc.text(
            "Subscription Intelligence & Recurring Spend Audit",
            pageWidth / 2,
            pageHeight - 7,
            {
                align: "center"
            }
        );

        doc.text(
            `Page ${pageNumber}`,
            pageWidth - margin,
            pageHeight - 7,
            {
                align: "right"
            }
        );
    }


    function sectionTitle(
        label,
        title
    ) {

        ensureSpace(18);

        resetCharSpacing();

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(8);

        doc.setTextColor(
            ...primary
        );

        doc.text(
            label.toUpperCase(),
            margin,
            y
        );

        y += 6;

        doc.setFontSize(15);

        doc.setTextColor(
            ...dark
        );

        doc.text(
            title,
            margin,
            y
        );

        y += 9;
    }


    function roundedBox(
        x,
        top,
        width,
        height,
        fill
    ) {

        doc.setFillColor(
            ...fill
        );

        doc.roundedRect(
            x,
            top,
            width,
            height,
            3,
            3,
            "F"
        );
    }


    function metricCard(
        x,
        width,
        label,
        value
    ) {

        roundedBox(
            x,
            y,
            width,
            25,
            light
        );

        resetCharSpacing();

        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.setFontSize(7.5);

        doc.setTextColor(
            ...muted
        );

        doc.text(
            label.toUpperCase(),
            x + 5,
            y + 7
        );

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(13);

        doc.setTextColor(
            ...dark
        );

        doc.text(
            cleanText(value),
            x + 5,
            y + 17
        );
    }


    function smallText(
        value,
        size = 8.5,
        color = text,
        bold = false
    ) {

        resetCharSpacing();

        doc.setFont(
            "helvetica",
            bold
                ? "bold"
                : "normal"
        );

        doc.setFontSize(size);

        doc.setTextColor(
            ...color
        );

        doc.text(
            cleanText(value),
            margin,
            y
        );

        y += 5;
    }


    function progressBar(
        label,
        value,
        percentage
    ) {

        ensureSpace(16);

        resetCharSpacing();

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(8);

        doc.setTextColor(
            ...text
        );

        doc.text(
            label,
            margin,
            y
        );

        doc.text(
            `${percentage.toFixed(1)}%`,
            pageWidth - margin,
            y,
            {
                align: "right"
            }
        );

        y += 4;

        doc.setFillColor(
            226,
            232,
            240
        );

        doc.roundedRect(
            margin,
            y,
            pageWidth - margin * 2,
            4,
            2,
            2,
            "F"
        );

        const filled =
            Math.max(
                0,
                Math.min(
                    100,
                    percentage
                )
            );

        doc.setFillColor(
            ...primary
        );

        doc.roundedRect(
            margin,
            y,
            (
                pageWidth -
                margin * 2
            ) * (filled / 100),
            4,
            2,
            2,
            "F"
        );

        y += 9;
    }


    /* =====================================================
       PAGE 1 — EXECUTIVE SUMMARY
    ===================================================== */

    drawFooter();


    /* HEADER */

    doc.setFillColor(
        ...primary
    );

    doc.roundedRect(
        margin,
        y,
        pageWidth - margin * 2,
        35,
        5,
        5,
        "F"
    );

    resetCharSpacing();

    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.setFontSize(24);

    doc.setTextColor(
        255,
        255,
        255
    );

    doc.text(
        "SubSentry",
        margin + 7,
        y + 13
    );

    doc.setFont(
        "helvetica",
        "normal"
    );

    doc.setFontSize(8.5);

    doc.text(
        "Subscription Intelligence & Recurring Spend Audit",
        margin + 7,
        y + 21
    );

    doc.setFontSize(8);

    doc.text(
        reportDate(),
        pageWidth - margin - 7,
        y + 12,
        {
            align: "right"
        }
    );

    y += 44;


    /* REPORT OVERVIEW */

    sectionTitle(
        "REPORT OVERVIEW",
        `Financial snapshot for ${
            report.user.name || "User"
        }`
    );

    smallText(
        `Prepared for: ${
            report.user.name || "SubSentry User"
        }`,
        9,
        text,
        true
    );

    if (report.user.email) {

        smallText(
            `Email: ${report.user.email}`,
            8.5,
            muted
        );
    }

    smallText(
        "A clear overview of recurring subscriptions, normalized spending, budget position and potential service overlaps.",
        8.5,
        muted
    );

    y += 3;


    /* METRICS */

    sectionTitle(
        "AT A GLANCE",
        "Your subscription health"
    );

    const cardGap = 7;

    const cardWidth =
        (
            pageWidth -
            margin * 2 -
            cardGap
        ) / 2;

    metricCard(
        margin,
        cardWidth,
        "Monthly Burn",
        reportCurrency(
            report.monthlyBurn
        )
    );

    metricCard(
        margin +
            cardWidth +
            cardGap,
        cardWidth,
        "Annualized Cost",
        reportCurrency(
            report.annualCost
        )
    );

    y += 31;

    metricCard(
        margin,
        cardWidth,
        "Active Subscriptions",
        report.subscriptions.length
    );

    metricCard(
        margin +
            cardWidth +
            cardGap,
        cardWidth,
        "Potential Overlaps",
        report.overlaps.length
    );

    y += 31;


    /* BUDGET */

    sectionTitle(
        "BUDGET",
        "Monthly financial position"
    );

    smallText(
        `Monthly income: ${reportCurrency(
            report.monthlyIncome
        )}`
    );

    smallText(
        `Subscription spending: ${reportCurrency(
            report.monthlyBurn
        )}`
    );

    smallText(
        `Other expenses: ${reportCurrency(
            report.otherExpenses
        )}`
    );

    smallText(
        `Total monthly expenses: ${reportCurrency(
            report.totalExpenses
        )}`,
        8.5,
        text,
        true
    );

    smallText(
        `Remaining: ${reportCurrency(
            report.remaining
        )}`,
        8.5,
        report.remaining >= 0
            ? green
            : red,
        true
    );

    y += 2;

    if (report.monthlyIncome > 0) {

        const subscriptionLoad =
            (
                report.monthlyBurn /
                report.monthlyIncome
            ) * 100;

        progressBar(
            "Subscription load",
            report.monthlyBurn,
            subscriptionLoad
        );
    }


    /* CATEGORY */

    sectionTitle(
        "SPENDING",
        "Where your subscription money goes"
    );

    if (
        !report.categories.length
    ) {

        smallText(
            "No subscription categories available yet.",
            8.5,
            muted
        );

    } else {

        const topCategories =
            report.categories.slice(
                0,
                5
            );

        topCategories.forEach(
            ([category, amount]) => {

                const percentage =
                    report.monthlyBurn > 0
                        ? (
                            amount /
                            report.monthlyBurn
                        ) * 100
                        : 0;

                progressBar(
                    category,
                    amount,
                    percentage
                );
            }
        );
    }


    /* =====================================================
       PAGE 2 — LEDGER & INSIGHTS
    ===================================================== */

    addPage();


    sectionTitle(
        "SUBSCRIPTION LEDGER",
        "Every recurring service at a glance"
    );


    /* TABLE HEADER */

    const tableX = margin;

    const colService = 58;
    const colCategory = 38;
    const colCycle = 28;
    const colOriginal = 37;
    const colMonthly =
        pageWidth -
        margin * 2 -
        colService -
        colCategory -
        colCycle -
        colOriginal;

    doc.setFillColor(
        226,
        232,
        240
    );

    doc.roundedRect(
        tableX,
        y,
        pageWidth - margin * 2,
        9,
        2,
        2,
        "F"
    );

    resetCharSpacing();

    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.setFontSize(7);

    doc.setTextColor(
        ...text
    );

    let x = tableX + 3;

    doc.text(
        "SERVICE",
        x,
        y + 6
    );

    x += colService;

    doc.text(
        "CATEGORY",
        x,
        y + 6
    );

    x += colCategory;

    doc.text(
        "CYCLE",
        x,
        y + 6
    );

    x += colCycle;

    doc.text(
        "ORIGINAL",
        x,
        y + 6
    );

    x += colOriginal;

    doc.text(
        "MONTHLY",
        x,
        y + 6
    );

    y += 12;


    if (
        !report.subscriptions.length
    ) {

        smallText(
            "No subscriptions have been added.",
            8.5,
            muted
        );

    } else {

        report.subscriptions.forEach(
            subscription => {

                ensureSpace(16);

                const monthly =
                    typeof normalizeMonthlyAmount === "function"
                        ? normalizeMonthlyAmount(
                            subscription.amount,
                            subscription.billingCycle
                        )
                        : Number(
                            subscription.amount
                        ) || 0;

                const service =
                    cleanText(
                        subscription.name ||
                        "Unnamed"
                    );

                const category =
                    cleanText(
                        subscription.category ||
                        "Other"
                    );

                const cycle =
                    cleanText(
                        subscription.billingCycle ||
                        "monthly"
                    );

                let tx =
                    tableX + 3;

                doc.setFont(
                    "helvetica",
                    "bold"
                );

                doc.setFontSize(7.5);

                doc.setTextColor(
                    ...dark
                );

                doc.text(
                    service.substring(
                        0,
                        27
                    ),
                    tx,
                    y
                );

                tx += colService;

                doc.setFont(
                    "helvetica",
                    "normal"
                );

                doc.setTextColor(
                    ...text
                );

                doc.text(
                    category.substring(
                        0,
                        18
                    ),
                    tx,
                    y
                );

                tx += colCategory;

                doc.text(
                    cycle.substring(
                        0,
                        10
                    ),
                    tx,
                    y
                );

                tx += colCycle;

                doc.text(
                    reportCurrency(
                        subscription.amount
                    ),
                    tx,
                    y
                );

                tx += colOriginal;

                doc.setFont(
                    "helvetica",
                    "bold"
                );

                doc.text(
                    reportCurrency(
                        monthly
                    ),
                    tx,
                    y
                );

                y += 5;

                if (
                    subscription.startDate
                ) {

                    doc.setFont(
                        "helvetica",
                        "normal"
                    );

                    doc.setFontSize(6.5);

                    doc.setTextColor(
                        ...muted
                    );

                    doc.text(
                        `Started ${
                            typeof formatDate === "function"
                                ? formatDate(
                                    subscription.startDate
                                )
                                : subscription.startDate
                        }`,
                        tableX + 3,
                        y
                    );

                    y += 3;
                }

                doc.setDrawColor(
                    ...border
                );

                doc.line(
                    tableX,
                    y + 2,
                    pageWidth - margin,
                    y + 2
                );

                y += 7;
            }
        );
    }


    /* OVERLAPS */

    sectionTitle(
        "OVERLAP DETECTION",
        "Subscriptions worth reviewing"
    );

    if (
        !report.overlaps.length
    ) {

        roundedBox(
            margin,
            y,
            pageWidth - margin * 2,
            20,
            [240, 253, 244]
        );

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(9);

        doc.setTextColor(
            ...green
        );

        doc.text(
            "No potential overlaps detected",
            margin + 6,
            y + 8
        );

        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.setFontSize(7.5);

        doc.setTextColor(
            ...text
        );

        doc.text(
            "No same-category subscription pairs currently require review.",
            margin + 6,
            y + 14
        );

        y += 27;

    } else {

        report.overlaps
            .slice(0, 5)
            .forEach(
                overlap => {

                    ensureSpace(24);

                    roundedBox(
                        margin,
                        y,
                        pageWidth - margin * 2,
                        22,
                        [254, 242, 242]
                    );

                    doc.setFont(
                        "helvetica",
                        "bold"
                    );

                    doc.setFontSize(9);

                    doc.setTextColor(
                        ...red
                    );

                    const first =
                        cleanText(
                            overlap.first?.name ||
                            "Subscription 1"
                        );

                    const second =
                        cleanText(
                            overlap.second?.name ||
                            "Subscription 2"
                        );

                    doc.text(
                        `${first} + ${second}`,
                        margin + 6,
                        y + 8
                    );

                    doc.setFont(
                        "helvetica",
                        "normal"
                    );

                    doc.setFontSize(7.5);

                    doc.setTextColor(
                        ...text
                    );

                    doc.text(
                        `Category: ${
                            cleanText(
                                overlap.category ||
                                "Other"
                            )
                        }`,
                        margin + 6,
                        y + 14
                    );

                    doc.text(
                        `Combined monthly cost: ${
                            reportCurrency(
                                overlap.combined
                            )
                        }`,
                        pageWidth - margin - 6,
                        y + 14,
                        {
                            align: "right"
                        }
                    );

                    y += 28;
                }
            );
    }


    /* SMART INSIGHTS */

    sectionTitle(
        "SMART INSIGHTS",
        "What your spending says"
    );

    if (
        report.categories.length
    ) {

        const top =
            report.categories[0];

        roundedBox(
            margin,
            y,
            pageWidth - margin * 2,
            26,
            light
        );

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(9);

        doc.setTextColor(
            ...dark
        );

        doc.text(
            "Highest spending category",
            margin + 6,
            y + 8
        );

        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.setFontSize(8);

        doc.setTextColor(
            ...text
        );

        doc.text(
            `${cleanText(top[0])} accounts for ${reportCurrency(
                top[1]
            )} per month.`,
            margin + 6,
            y + 15
        );

        y += 31;
    }


    roundedBox(
        margin,
        y,
        pageWidth - margin * 2,
        26,
        light
    );

    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.setFontSize(9);

    doc.setTextColor(
        ...dark
    );

    doc.text(
        "Annual recurring commitment",
        margin + 6,
        y + 8
    );

    doc.setFont(
        "helvetica",
        "normal"
    );

    doc.setFontSize(8);

    doc.setTextColor(
        ...text
    );

    doc.text(
        `Your current subscriptions represent approximately ${reportCurrency(
            report.annualCost
        )} per year.`,
        margin + 6,
        y + 15
    );

    y += 31;


    /* FINAL NOTE */

    ensureSpace(30);

    doc.setFillColor(
        ...primary
    );

    doc.roundedRect(
        margin,
        y,
        pageWidth - margin * 2,
        28,
        4,
        4,
        "F"
    );

    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.setFontSize(10);

    doc.setTextColor(
        255,
        255,
        255
    );

    doc.text(
        "SubSentry recommendation",
        margin + 7,
        y + 9
    );

    doc.setFont(
        "helvetica",
        "normal"
    );

    doc.setFontSize(7.5);

    const recommendation =
        report.overlaps.length
            ? "Review the highlighted category overlaps and decide whether each recurring service still provides enough value."
            : "Continue reviewing your recurring subscriptions periodically to keep spending aligned with your budget.";

    const recommendationLines =
        doc.splitTextToSize(
            recommendation,
            pageWidth - margin * 2 - 14
        );

    doc.text(
        recommendationLines,
        margin + 7,
        y + 16
    );


    /* =====================================================
       FINALIZE FOOTERS
    ===================================================== */

    const totalPages =
        doc.internal.getNumberOfPages();

    for (
        let page = 1;
        page <= totalPages;
        page++
    ) {

        doc.setPage(page);

        drawFooter();
    }


    return doc;
}


/* =========================================================
   DOWNLOAD
========================================================= */

function downloadSubSentryReport() {

    const doc =
        createProfessionalReport();

    if (!doc) {
        return;
    }

    const userName =
        currentUser?.name
            ? currentUser.name
                .replace(
                    /[^a-z0-9]/gi,
                    "_"
                )
            : "User";

    doc.save(
        `SubSentry_Report_${userName}.pdf`
    );

    if (
        typeof showToast === "function"
    ) {

        showToast(
            "Your professional SubSentry report has been downloaded.",
            "success",
            "Report Ready"
        );
    }
}


/* =========================================================
   SHARE
========================================================= */

async function shareSubSentryReport() {

    const doc =
        createProfessionalReport();

    if (!doc) {
        return;
    }

    const blob =
        doc.output("blob");

    const file =
        new File(
            [blob],
            "SubSentry_Report.pdf",
            {
                type: "application/pdf"
            }
        );

    if (
        navigator.share &&
        (
            !navigator.canShare ||
            navigator.canShare({
                files: [file]
            })
        )
    ) {

        try {

            await navigator.share({
                title: "SubSentry Report",
                text: "My SubSentry subscription spending report.",
                files: [file]
            });

            if (
                typeof showToast === "function"
            ) {

                showToast(
                    "Report shared successfully.",
                    "success",
                    "Report Shared"
                );
            }

            return;

        } catch (error) {

            if (
                error.name ===
                "AbortError"
            ) {
                return;
            }
        }
    }


    doc.save(
        "SubSentry_Report.pdf"
    );

    if (
        typeof showToast === "function"
    ) {

        showToast(
            "File sharing is not supported here, so the report was downloaded instead.",
            "info",
            "Report Downloaded"
        );
    }
}


/* =========================================================
   BUTTON EVENTS
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const downloadButton =
            document.getElementById(
                "downloadReportButton"
            );

        const shareButton =
            document.getElementById(
                "shareReportButton"
            );

        if (downloadButton) {

            downloadButton.addEventListener(
                "click",
                downloadSubSentryReport
            );
        }

        if (shareButton) {

            shareButton.addEventListener(
                "click",
                shareSubSentryReport
            );
        }
    }
);