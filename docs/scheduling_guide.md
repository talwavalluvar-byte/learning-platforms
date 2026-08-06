# Windows Task Scheduler Setup Guide for Automobile ETL

This guide explains how to schedule your automated batch script ([run_etl.bat](file:///c:/Users/srika/OneDrive/Documents/C%20tutorial/DataEngineering/automobile-etl/run_etl.bat)) to run automatically every day using **Windows Task Scheduler**.

---

## 🛠️ Step-by-Step Task Scheduler Setup

### Step 1: Open Task Scheduler
1. Press `Win + R` on your keyboard to open the **Run** dialog.
2. Type `taskschd.msc` and press **Enter**.

---

### Step 2: Create a New Basic Task
1. In the right-hand **Actions** panel, click **Create Basic Task...**.
2. **Name**: `Automobile_DW_ETL_Daily_Refresh`
3. **Description**: `Automated PySpark Data Warehouse ETL refresh for 25 dimensions and fact_delivery.`
4. Click **Next**.

---

### Step 3: Configure Trigger (Schedule Time)
1. Select **Daily** and click **Next**.
2. Set the **Start Date** and preferred time (e.g., `02:00:00 AM` when source RDS load is lowest).
3. Set **Recur every**: `1` days.
4. Click **Next**.

---

### Step 4: Configure Action (Execute Batch Script)
1. Select **Start a program** and click **Next**.
2. **Program/script**:
   ```text
   c:\Users\srika\OneDrive\Documents\C tutorial\DataEngineering\automobile-etl\run_etl.bat
   ```
3. **Start in (optional)**:
   ```text
   c:\Users\srika\OneDrive\Documents\C tutorial\DataEngineering\automobile-etl
   ```
4. Click **Next**.

---

### Step 5: Final Security & Permission Settings
1. Check the box: **"Open the Properties dialog for this task when I click Finish"**.
2. Click **Finish**.
3. In the task **Properties** window under the **General** tab:
   - Select **"Run whether user is logged on or not"** (or *"Run only when user is logged on"*).
   - Check **"Run with highest privileges"**.
4. Click **OK**.

---

## 📝 Execution Logs & Monitoring

Every execution automatically appends stdout and stderr outputs to date-stamped log files located in:
```text
c:\Users\srika\OneDrive\Documents\C tutorial\DataEngineering\automobile-etl\logs\
```

- Successful runs will conclude with:
  `SUCCESS: ETL RUN COMPLETED SUCCESSFULLY AT [DATE] [TIME]`
- Error runs will log the stack trace and record:
  `ERROR: ETL RUN FAILED WITH EXIT CODE [CODE]`
