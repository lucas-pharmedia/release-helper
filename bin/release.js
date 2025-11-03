#!/usr/bin/env node
import inquirer from "inquirer";
import { execSync } from "child_process";
import chalk from "chalk";

function logInfo(msg) {
  console.log(chalk.cyan(`[release-helper] ${msg}`));
}

function logSuccess(msg) {
  console.log(chalk.green(`[release-helper] ${msg}`));
}

function logError(msg) {
  console.error(chalk.red(`[release-helper] ${msg}`));
}

async function main() {
  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: chalk.yellow("請選擇要執行的動作："),
      choices: [
        { name: "發版", value: "bump-version" },
        { name: "部署測試站", value: "deploy-dev" },
        { name: "部署正式站", value: "deploy-production" },
      ],
    },
  ]);

  if (action === "bump-version") {
    await handleBumpVersion();
  } else if (action === "deploy-dev") {
    await handleDeployDev();
  } else if (action === "deploy-production") {
    await handleDeployProduction();
  }
}

async function handleBumpVersion() {
  const { bumpType } = await inquirer.prompt([
    {
      type: "list",
      name: "bumpType",
      message: chalk.yellow("選擇要 bump 的版本："),
      choices: ["patch", "minor", "major"],
    },
  ]);

  const branchName = `chore/bump-version`;

  try {
    logInfo("拉取最新 develop...");
    execSync("git checkout develop && git pull origin develop", {
      stdio: "inherit",
    });

    logInfo(`建立新 branch: ${branchName}`);
    execSync(`git checkout -b ${branchName}`, { stdio: "inherit" });

    logInfo(`執行 npm version ${bumpType}...`);
    execSync(`npm version ${bumpType}`, { stdio: "inherit" });

    logInfo(`推送 branch: ${branchName}`);
    execSync(`git push origin ${branchName} --tags`, { stdio: "inherit" });

    logSuccess("版本 bump 完成 🎉");
  } catch (err) {
    logError("發生錯誤:");
    console.error(err);
  } finally {
    logInfo(`切回 develop 並刪除本地 branch: ${branchName}`);
    execSync("git checkout develop", { stdio: "inherit" });
    execSync(`git branch -D ${branchName}`, { stdio: "inherit" });
    logSuccess(`本地 branch ${branchName} 已刪除，遠端 branch 保留`);
  }
}

async function handleDeployDev() {
  try {
    logInfo("拉取最新 develop...");
    execSync("git checkout develop && git pull origin develop", {
      stdio: "inherit",
    });

    logInfo("切換到 release branch 並 merge develop...");
    execSync("git checkout release", { stdio: "inherit" });
    execSync("git merge develop", {
      stdio: "inherit",
    });

    logInfo("推送 release branch...");
    execSync("git push origin release", { stdio: "inherit" });

    logSuccess("測試站更新完成 🎉");
  } catch (err) {
    logError("發生錯誤:");
    console.error(err);
  } finally {
    logInfo("切回 develop...");
    execSync("git checkout develop", { stdio: "inherit" });
  }
}

async function handleDeployProduction() {
  try {
    logInfo("拉取最新 release...");
    execSync("git checkout release && git pull origin release", {
      stdio: "inherit",
    });

    logInfo("切換到 main branch 並 merge release...");
    execSync("git checkout main", { stdio: "inherit" });
    execSync("git merge release", {
      stdio: "inherit",
    });

    logInfo("推送 main branch...");
    execSync("git push origin main", { stdio: "inherit" });

    logSuccess("正式站更新完成 🎉");
  } catch (err) {
    logError("發生錯誤:");
    console.error(err);
  } finally {
    logInfo("切回 develop...");
    execSync("git checkout develop", { stdio: "inherit" });
  }
}

main();
