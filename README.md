# Thread Pool OS Simulator

An interactive Operating Systems project website that explains and simulates how a thread pool works in a concurrent system.

## Project Path

`E:\Everything\Codex Projects\OsProject-main`

## What This Project Does

This website combines:

- OS theory and thread-pool concepts
- a live interactive simulator
- real-time charts and metrics
- a thread lifecycle demo
- a race-condition / synchronization demo
- code examples in C++, Java, and Python
- architecture and monitoring visualizations

## Main Features

- Configurable worker-thread count, queue capacity, task duration, and arrival rate
- Scenario presets:
  - Balanced
  - Burst Traffic
  - CPU Heavy
  - I/O Heavy
  - Failure Lab
- Scheduling policies:
  - Priority First
  - FIFO
  - Shortest Job First
- Queue overflow policies:
  - Reject New Task
  - Drop Lowest Priority
  - Auto Expand Queue
- Task types:
  - CPU Bound
  - I/O Bound
  - Short Task
  - Long Task
  - Critical Task
  - Auto Mix
- Live metrics:
  - busy threads
  - idle threads
  - queue length
  - completed tasks
  - failed tasks
  - throughput
  - average wait time
  - average turnaround time
  - utilization
- Simulation summary panel
- TXT and JSON export of run results

## Files

- [`index.html`](E:\Everything\Codex Projects\OsProject-main\index.html): page structure and all sections
- [`style.css`](E:\Everything\Codex Projects\OsProject-main\style.css): full UI styling
- [`simulation.js`](E:\Everything\Codex Projects\OsProject-main\simulation.js): simulator engine, controls, metrics, summary, export logic
- [`charts.js`](E:\Everything\Codex Projects\OsProject-main\charts.js): Chart.js dashboard logic
- [`ui.js`](E:\Everything\Codex Projects\OsProject-main\ui.js): animations, keyboard shortcuts, responsive helpers
- [`IMPROVEMENTS_NOTES.txt`](E:\Everything\Codex Projects\OsProject-main\IMPROVEMENTS_NOTES.txt): future roadmap and enhancement ideas

## How To Run

1. Open [`index.html`](E:\Everything\Codex Projects\OsProject-main\index.html) in a browser.
2. Choose a preset or configure values manually.
3. Click `Start`.
4. Watch:
   - task queue
   - worker thread pool
   - live metrics
   - dashboard charts
   - monitor panel
   - summary panel

## How To Use The Simulator

### Pool Configuration

- `Worker Threads`: number of workers available
- `Queue Capacity`: maximum waiting tasks
- `Task Duration`: base task runtime
- `Task Arrival Rate`: auto-generated tasks per second
- `Scheduling Policy`: how waiting tasks are selected
- `Queue Overflow Policy`: what happens when the queue is full
- `Task Type`: kind of workload to generate

### Controls

- `Start`: start the simulation
- `Pause`: pause or resume it
- `Reset`: clear the current run
- `Add Task Manually`: add one task using current priority/type settings
- `TXT` / `JSON`: export a run summary

## Sections In The Website

- `Home`: project introduction and animated overview
- `Concepts`: thread-pool fundamentals
- `Simulator`: core interactive demo
- `Dashboard`: live charts
- `Lifecycle`: thread state visualization
- `Concurrency`: synchronization and race-condition demo
- `Performance`: comparison of with/without thread pool
- `Code`: multi-language examples
- `Architecture`: animated system flow
- `Monitor`: live thread monitoring table

## Keyboard Shortcuts

- `Space`: start / pause
- `T`: add task
- `R`: reset
- `A`: animate architecture
- `L`: animate lifecycle

## Notes

- The charts use Chart.js from CDN.
- Code highlighting uses Prism from CDN.
- If those CDN resources do not load, the website still stays usable and fails gracefully.

## Verification Done

- JavaScript syntax checked with `node --check`
- HTML `onclick` handlers matched to real functions
- Direct DOM ID references checked against actual page IDs
- Broken text-encoding issues cleaned up

## Suggested Next Improvements

- add more charts such as wait-time trends
- add report history
- split `simulation.js` into smaller modules
- add more advanced scheduling comparisons
- improve accessibility and mobile polish
