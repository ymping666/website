// Original teaching exercises inspired by public, unverified interview accounts.
const bi=(en,zh)=>[en,zh];
const fixture=(id,phase,name,input,expected)=>({id,phase,name,input,expected});
const mazeReference=`from collections import deque

def shortest_path(grid, start, goal, portals):
    rows, cols = len(grid), len(grid[0])
    start, goal = tuple(start), tuple(goal)
    if grid[start[0]][start[1]] == "#" or grid[goal[0]][goal[1]] == "#":
        return -1
    links = {}
    for source, target in portals:
        links.setdefault(tuple(source), []).append(tuple(target))
    pending = deque([(start, 0)])
    seen = {start}
    while pending:
        (r, c), distance = pending.popleft()
        if (r, c) == goal:
            return distance
        neighbors = [(r - 1, c), (r + 1, c), (r, c - 1), (r, c + 1)]
        neighbors += links.get((r, c), [])
        for nr, nc in neighbors:
            if (0 <= nr < rows and 0 <= nc < cols
                    and grid[nr][nc] != "#" and (nr, nc) not in seen):
                seen.add((nr, nc))
                pending.append(((nr, nc), distance + 1))
    return -1
`;
const mazeStarter=mazeReference.replace('pending.popleft()', 'pending.pop()').replace('0 <= nr < rows and 0 <= nc < cols','0 < nr < rows and 0 < nc < cols').replace('        neighbors += links.get((r, c), [])\n','');
const mazePartial=mazeReference.replace('        neighbors += links.get((r, c), [])\n','');
const mazeInput=(grid,start,goal,portals=[])=>({grid,start,goal,portals});

const balanceReference=`import heapq

def assign_requests(k, requests):
    # requests are [arrival, duration], already ordered by arrival.
    available = list(range(k))
    heapq.heapify(available)
    busy = []  # (finish_time, server_id)
    assigned = []
    for arrival, duration in requests:
        while busy and busy[0][0] <= arrival:
            _, server = heapq.heappop(busy)
            heapq.heappush(available, server)
        if not available:
            assigned.append(-1)
            continue
        server = heapq.heappop(available)
        assigned.append(server)
        heapq.heappush(busy, (arrival + duration, server))
    return assigned
`;
const balanceStarter=balanceReference.replace('while busy and busy[0][0] <= arrival:', 'if busy and busy[0][0] < arrival:');
const balancePartial=balanceReference.replace('while busy and busy[0][0] <= arrival:', 'if busy and busy[0][0] <= arrival:');
const balanceInput=(k,requests)=>({k,requests});

const canvasReference=`from copy import deepcopy

def apply_canvas(initial, commands):
    shapes = deepcopy(initial)
    undo, redo = [], []
    for command in commands:
        op = command["op"]
        if op == "undo":
            if undo:
                redo.append(deepcopy(shapes))
                shapes = undo.pop()
            continue
        if op == "redo":
            if redo:
                undo.append(deepcopy(shapes))
                shapes = redo.pop()
            continue
        before = deepcopy(shapes)
        if op == "add":
            shape = command["shape"]
            if not any(s["id"] == shape["id"] for s in shapes):
                shapes.append(deepcopy(shape))
        elif op == "move":
            for shape in shapes:
                if shape["id"] == command["id"]:
                    shape["x"], shape["y"] = command["x"], command["y"]
                    break
        elif op == "delete":
            shapes = [s for s in shapes if s["id"] != command["id"]]
        if shapes != before:
            undo.append(before)
            redo.clear()
    return {"shapes": shapes, "undo_depth": len(undo), "redo_depth": len(redo)}
`;
// Existing add/move/delete work. The new history feature is missing in this starter.
const canvasStarter=canvasReference.replace(/        if op == "undo":[\s\S]*?        before = deepcopy\(shapes\)/, '        if op in ("undo", "redo"):\n            continue  # TODO: implement history navigation\n        before = deepcopy(shapes)');
// Deliberately shallow snapshots: moving a shape mutates the saved undo state.
const canvasPartial=canvasReference.replaceAll('deepcopy(shapes)','list(shapes)').replace('before = list(shapes)','before = list(shapes)');
const rect=(id,x=10,y=10)=>({id,x,y,width:20,height:15});
const command=(op,fields={})=>({op,...fields});
const canvasInput=(initial,commands)=>({initial,commands});
const canvasOutput=(shapes,u=0,r=0)=>({shapes,undo_depth:u,redo_depth:r});
const A=rect('A'), B=rect('B',50,30), movedA=rect('A',70,40);

export const scenarios=[
  {
    id:'maze-debugging',version:'maze-v1',company:'Meta',mode:'debug',number:'01',
    title:bi('Debug a maze navigator','修复迷宫导航器'),
    subtitle:bi('Read an unfamiliar traversal, fix boundary bugs, then support directed portals.','读懂已有遍历逻辑，修复边界与最短路问题，再支持单向传送门。'),
    category:bi('Comprehension & debugging','理解与调试'),duration:bi('25–35 min','25–35 分钟'),file:'maze.py',signature:'shortest_path(grid, start, goal, portals)',args:['grid','start','goal','portals'],
    source:{url:'https://www.reddit.com/r/leetcode/comments/1p35b98/meta_e4_software_product_interview_experience/',title:'Meta E4 Software Product Interview Experience — Including AI Enabled Coding',summary:bi('The author describes a maze codebase with walls, portals and staged failing tests. We use only that broad task format; our grid rules, code and tests are original.','作者描述了带墙、传送门的迷宫代码库及分阶段失败测试。本题仅借鉴任务形式；网格规则、代码和测试均为原创。')},
    brief:bi('You inherit a navigator that sometimes cannot reach a visible neighbor and sometimes returns a longer route. Repair the existing implementation, then finish portal support.','你接手的导航器有时到不了相邻格子，有时返回绕远的路线。先修复已有实现，再补齐传送门支持。'),
    contract:[bi('grid is a rectangular 1–8 by 1–8 grid of "." and "#". Coordinates are [row, column], zero-based; start and goal are in bounds. Blocked endpoints return -1.','grid 为 1–8 行、1–8 列的矩形，仅含 . 和 #。坐标为从 0 开始的 [行, 列]，起终点均在范围内；端点是墙则返回 -1。'),bi('One step moves up, down, left or right to an open cell. Return the minimum number of steps, or -1 if unreachable; start == goal costs 0 when open.','每一步可上下左右移动到空格。返回最少步数；不可达返回 -1；空格上的起终点相同返回 0。'),bi('At most 30 portals; each is [source, target], both open and in bounds. It adds an optional directed edge costing one step. Normal moves remain available; repeated edges and cycles are allowed.','最多 30 个传送门，每个为 [入口, 出口]，端点均为空格。它新增一条可选单向边，消耗 1 步；仍可正常移动，允许重复边与环。'),bi('Do not mutate the inputs. This exercise uses an explicit grid, not the graph serialization described in the source account.','不得修改输入。本题使用显式网格，未复现来源描述中的图序列化。')],
    phases:[bi('01 · Boundaries & walls','01 · 边界与墙'),bi('02 · Shortest paths','02 · 最短路径'),bi('03 · Portal integration','03 · 传送门集成')],
    starter:mazeStarter,partial:mazePartial,reference:mazeReference,initialInput:mazeInput(['...','.#.','...'],[0,0],[0,2]),
    suggestion:bi('“Use a stack for traversal, and exclude index zero to avoid negative-index wraparound.” Check that advice against the contract.','“用栈遍历，并排除索引 0，防止负索引回绕。”请根据契约检查这个建议。'),
    partialLabel:bi('B · Correct BFS, no portal edges','B · 修正 BFS，尚未接入传送门'),
    hint:bi('Zero is a valid coordinate. Every edge costs one step, so ask which pending node must be processed first. Portal edges belong in the same neighbor expansion.','0 是合法坐标。每条边都消耗 1 步，应该先处理哪个待访问节点？传送门边也应参与同一次邻居扩展。'),
    takeaway:bi('Bounds, traversal order and graph edges are separate responsibilities. A FIFO BFS finds shortest paths when all edges cost one step; mark cells seen when enqueuing to avoid cycles.','边界检查、遍历顺序和图的边是不同职责。所有边代价均为 1 时，先进先出的 BFS 可以求最短路；入队时标记访问可避免环。'),
    transfer:{prompt:bi('There is a portal from A to B, but none from B to A. What does that imply?','有 A→B 传送门，但没有 B→A，这意味着什么？'),options:[bi('Both directions are available','两个方向都可用'),bi('Only A→B is added; a normal route back may still exist','只新增 A→B；仍可能有普通路线返回'),bi('Entering A must teleport immediately','走到 A 必须立即传送')],answer:1,explanation:bi('Portals are optional directed edges. Direction and compulsory movement are different rules.','传送门是可选单向边；方向性与强制移动是不同规则。')},
    fixtures:[
      fixture('same',0,bi('Open start equals goal','空格上的起终点相同'),mazeInput(['.'],[0,0],[0,0]),0),
      fixture('top-row',0,bi('Move along row zero','沿第 0 行移动'),mazeInput(['...'],[0,0],[0,2]),2),
      fixture('left-column',0,bi('Move along column zero','沿第 0 列移动'),mazeInput(['.','.','.'],[2,0],[0,0]),2),
      fixture('wall',0,bi('Wall blocks the route','墙阻断路径'),mazeInput(['.#.'],[0,0],[0,2]),-1),
      fixture('blocked-start',0,bi('Blocked start','起点是墙'),mazeInput(['#.'],[0,0],[0,1]),-1),
      fixture('blocked-goal',0,bi('Blocked goal','终点是墙'),mazeInput(['.#'],[0,0],[0,1]),-1),
      fixture('short-route',1,bi('Avoid a longer DFS route','避免 DFS 绕远'),mazeInput(['....','.#.#','....','...#'],[0,3],[3,2]),4),
      fixture('detour',1,bi('Shortest detour around a wall','绕墙最短路'),mazeInput(['...','.#.','...'],[0,0],[2,2]),4),
      fixture('isolated',1,bi('Disconnected open regions','空格区域不连通'),mazeInput(['.#.','###','.#.'],[0,0],[2,2]),-1),
      fixture('cycles',1,bi('Open grid contains cycles','有环的开放网格'),mazeInput(['...','...','...'],[1,1],[0,0]),2),
      fixture('portal-bridge',2,bi('Portal bridges disconnected cells','传送门连接孤立格'),mazeInput(['.#.'],[0,0],[0,2],[[[0,0],[0,2]]]),1),
      fixture('portal-direction',2,bi('A portal is not bidirectional','传送门不自动双向'),mazeInput(['.#.'],[0,2],[0,0],[[[0,0],[0,2]]]),-1),
      fixture('portal-optional',2,bi('Normal moves remain available','仍可选择普通移动'),mazeInput(['...'],[0,0],[0,1],[[[0,0],[0,2]]]),1),
      fixture('portal-chain',2,bi('Two directed portal hops','两次单向传送'),mazeInput(['.#.#.'],[0,0],[0,4],[[[0,0],[0,2]],[[0,2],[0,4]]]),2),
      fixture('portal-cycle',2,bi('Portal cycles and duplicates','传送门环与重复边'),mazeInput(['.#.'],[0,0],[0,2],[[[0,0],[0,0]],[[0,0],[0,2]],[[0,0],[0,2]],[[0,2],[0,0]]]),1),
    ],
  },
  {
    id:'load-balancer-review',version:'balancer-v1',company:'Microsoft',mode:'review',number:'02',
    title:bi('Review a load balancer refactor','审查负载均衡器重构'),subtitle:bi('An AI cleanup passes ordinary samples. Challenge release timing and simultaneous completions.','AI 的精简建议通过普通样例。请检查释放时机和多个请求同时结束的情况。'),
    category:bi('AI code review','AI 代码审查'),duration:bi('20–30 min','20–30 分钟'),file:'balancer.py',signature:'assign_requests(k, requests)',args:['k','requests'],
    source:{url:'https://www.reddit.com/r/leetcode/comments/1sfgtu3/ai_assisted_coding_interview_experience_microsoft/',title:'AI assisted coding interview experience — Microsoft SDE2',summary:bi('The author describes a load-balancer problem, two min-heaps and debugging with Claude. The routing policy, refactor, counterexamples and tests here are our own.','作者描述了负载均衡问题、两个最小堆及使用 Claude 调试的经历。本题的分配规则、重构、反例与测试为原创。')},
    brief:bi('A refactor replaces a release loop with one conditional and tightens its comparison. The author calls it a small cleanup. Decide whether it preserves the scheduler contract, then verify a repair.','一次重构把释放循环改成单次判断，并收紧比较条件。提交者称这只是小幅精简。请判断是否保持调度契约，再修复并验证。'),
    contract:[bi('k is 1–8. requests contains up to 30 [arrival, duration] pairs, sorted by nondecreasing arrival. Times are integers from 0 to 100; duration is 1–20. Equal-arrival requests retain input order.','k 为 1–8。requests 最多 30 个 [到达时间, 时长]，按到达时间非递减排列；到达时间为 0–100 的整数，时长为 1–20。同一时刻的请求按输入顺序处理。'),bi('Before each assignment, release ALL servers whose finish_time <= arrival. Always choose the lowest-ID available server.','每次分配前，释放所有完成时间 <= 到达时间的服务器；始终选择空闲服务器中 ID 最小者。'),bi('If all servers are busy, drop the request and output -1; no queue or preemption. A dropped request changes no server state.','所有服务器繁忙时丢弃请求，输出 -1；不排队、不抢占，丢弃不改变服务器状态。'),bi('Return one server ID or -1 per request, without mutating requests. This is a small deterministic scheduler, not a distributed load-balancing system.','每个请求返回服务器 ID 或 -1，不修改输入。本题是确定性小调度器，不是分布式负载均衡系统。')],
    phases:[bi('01 · Ordinary behavior','01 · 普通行为'),bi('02 · Release boundary','02 · 释放边界'),bi('03 · All completions & ties','03 · 批量释放与并列')],
    starter:balanceStarter,partial:balancePartial,reference:balanceReference,initialInput:balanceInput(2,[[0,5],[1,5],[2,2],[7,1]]),
    suggestion:bi('“Only one new request arrives per iteration, so releasing one server is sufficient. A server should finish strictly before arrival.”','“每轮只处理一个新请求，释放一台服务器就够了；服务器应在请求到达之前严格完成。”'),
    partialLabel:bi('B · Fix <= but release only one','B · 修正 <=，仍只释放一台'),hint:bi('Test an arrival exactly at a finish time. Then let several servers finish before the next request: the earliest finish and the smallest server ID need not agree.','先试到达时间恰好等于完成时间；再让多台服务器在下个请求前完成：最早完成的服务器未必 ID 最小。'),
    takeaway:bi('The busy heap orders completion times; the available heap orders server IDs. Drain every eligible completion before selecting a server. Replacing while with if changes the state invariant.','繁忙堆按完成时间排序，空闲堆按服务器 ID 排序。选择服务器之前，必须释放所有已完成请求。把 while 改成 if 会破坏状态不变量。'),
    transfer:{prompt:bi('Server 0 finishes at 5, server 1 at 3. A request arrives at 6. Which server must receive it?','服务器 0 在时刻 5 完成，服务器 1 在时刻 3 完成。新请求在时刻 6 到达，应分给谁？'),options:[bi('Server 1, because it finished first','服务器 1，因为它先完成'),bi('Server 0, because both are available and its ID is lower','服务器 0，因为都已空闲且它的 ID 更小'),bi('Drop the request','丢弃请求')],answer:1,explanation:bi('Release both, then apply the smallest-ID policy. Completion order is not the assignment policy.','先释放两台，再应用最小 ID 策略。完成顺序不是分配策略。')},
    fixtures:[
      fixture('empty',0,bi('No requests','没有请求'),balanceInput(2,[]),[]),
      fixture('ordinary',0,bi('Available, busy, then idle','空闲、繁忙再释放'),balanceInput(2,[[0,5],[1,5],[2,2],[7,1]]),[0,1,-1,0]),
      fixture('capacity',0,bi('Drop when at capacity','满载时丢弃'),balanceInput(1,[[0,5],[1,1],[2,1]]),[0,-1,-1]),
      fixture('equal',1,bi('Finish equals arrival','完成时刻等于到达时刻'),balanceInput(1,[[0,2],[2,1]]),[0,0]),
      fixture('consecutive',1,bi('Repeated exact reuse','连续恰好复用'),balanceInput(1,[[0,1],[1,1],[2,1]]),[0,0,0]),
      fixture('equal-input-order',1,bi('Same arrivals retain input order','相同到达时间按输入顺序'),balanceInput(2,[[0,1],[0,3],[1,1],[1,1]]),[0,1,0,-1]),
      fixture('all-release',2,bi('Release all before choosing lowest ID','全部释放后选最小 ID'),balanceInput(2,[[0,5],[0,3],[6,1]]),[0,1,0]),
      fixture('three-release',2,bi('Three available servers','三台同时已空闲'),balanceInput(3,[[0,5],[0,2],[0,3],[6,1]]),[0,1,2,0]),
      fixture('same-finish',2,bi('Simultaneous completions','同时完成'),balanceInput(2,[[0,3],[1,2],[3,2],[3,1]]),[0,1,0,1]),
      fixture('dropped-neutral',2,bi('Dropped work must not extend busy time','丢弃不延长忙碌时间'),balanceInput(1,[[0,3],[1,20],[3,2]]),[0,-1,0]),
      fixture('existing-free',2,bi('Released low ID beats already-free high ID','释放的低 ID 优先于原空闲高 ID'),balanceInput(3,[[0,2],[3,2]]),[0,0]),
      fixture('last-arrival',2,bi('Late request and long duration','较晚请求与较长时长'),balanceInput(2,[[0,20],[0,1],[100,20]]),[0,1,0]),
    ],
  },
  {
    id:'canvas-history',version:'canvas-v1',company:'Canva',mode:'extend',number:'03',
    title:bi('Add undo and redo to a canvas','为画布添加撤销与重做'),subtitle:bi('Extend a tiny shape editor while keeping existing add, move and delete behavior intact.','接手已有图形编辑器，保留添加、移动、删除行为，再实现可靠的历史记录。'),
    category:bi('Feature iteration','功能迭代'),duration:bi('30–40 min','30–40 分钟'),file:'canvas.py',signature:'apply_canvas(initial, commands)',args:['initial','commands'],
    source:{url:'https://www.reddit.com/r/cscareerquestionsOCE/comments/1t1jfxx/canva_interview_notes/',title:'Canva Interview Notes',summary:bi('The author describes building a basic Canva-like canvas with draggable shapes, and a separate code-review round. Undo/redo is our original extension; the post does not say Canva asked this feature.','作者描述了搭建可拖拽图形的简易 Canva 画布及独立代码审查轮次。撤销/重做是本题原创扩展，面经没有声称 Canva 考过此功能。')},
    brief:bi('The editor already adds, moves and deletes rectangles. Your task is to implement undo and redo without corrupting older states. This exercise focuses on the state engine, not a full UI or collaborative editor.','编辑器已经可以添加、移动和删除矩形。请补齐撤销与重做，同时保证历史快照不被后续修改污染。本题聚焦状态引擎，不实现完整 UI 或协作编辑。'),
    contract:[bi('initial has at most 8 rectangles with unique string IDs. Each rectangle has exactly id, x, y, width, height; coordinates are 0–80 and sizes 1–20. Commands contain add(shape), move(id,x,y), delete(id), undo or redo.','initial 最多 8 个矩形，字符串 ID 唯一。每个矩形恰有 id、x、y、width、height；坐标为 0–80，尺寸为 1–20。命令为 add(shape)、move(id,x,y)、delete(id)、undo、redo。'),bi('An actual add/move/delete stores an independent previous-state snapshot and clears redo. Duplicate add, missing ID and moves to the same position are no-ops: do not record them or clear redo.','实际改变状态的添加/移动/删除，保存独立的旧快照并清空重做栈。重复 ID 添加、ID 不存在、移动到原位置均为空操作，不记历史，也不清空重做。'),bi('undo restores the latest prior state and pushes the current state to redo. redo does the reverse. Empty history makes undo/redo a no-op. Preserve shape order; an add appends.','undo 恢复上一个状态，并将当前状态放入重做栈；redo 反向操作。历史为空时不操作。保持图形顺序，添加追加到末尾。'),bi('Return {shapes, undo_depth, redo_depth}. Do not mutate initial or commands. At most 30 commands; this is an in-memory snapshot model, not persistent or collaborative history.','返回 {shapes, undo_depth, redo_depth}，不修改 initial 或 commands。最多 30 条命令；仅为内存快照模型，不涉及持久化或多人历史。')],
    phases:[bi('01 · Preserve old operations','01 · 保留旧功能'),bi('02 · Undo & redo','02 · 撤销与重做'),bi('03 · Snapshots & branches','03 · 快照与分支')],
    starter:canvasStarter,partial:canvasPartial,reference:canvasReference,initialInput:canvasInput([A],[command('move',{id:'A',x:70,y:40}),command('undo')]),
    suggestion:bi('A suggested implementation stores snapshots with list(shapes). Before adopting it, check what happens to the dictionaries inside the list.','一个建议用 list(shapes) 保存快照。采纳之前，请检查列表内部的字典是否仍被共享。'),
    partialLabel:bi('B · Undo/redo with shallow snapshots','B · 使用浅拷贝的撤销/重做'),hint:bi('A new list is not a new set of shape dictionaries. Also distinguish an attempted edit from an actual state change before clearing redo.','新列表不代表内部图形字典也是新的。清空重做之前，也要区分“尝试编辑”和“状态确实改变”。'),
    takeaway:bi('History must retain values at a point in time. Deep snapshots prevent later moves from rewriting the past. Only real changes create a new history branch; no-ops preserve redo.','历史必须保留某一时刻的值。独立深快照避免后续移动改写过去。只有真正的修改才创建新分支；空操作应保留重做。'),
    transfer:{prompt:bi('Add B, undo, then try deleting a missing ID. What should redo do?','添加 B 后撤销，再尝试删除不存在的 ID。此时重做应该怎样？'),options:[bi('Do nothing: every command clears redo','无变化：每条命令都清空重做'),bi('Restore B: the deletion was a no-op','恢复 B：删除是空操作'),bi('Delete all shapes','删除所有图形')],answer:1,explanation:bi('The failed deletion changes no state, so the redo branch remains available.','删除不存在的 ID 没有改变状态，因此重做分支仍然保留。')},
    fixtures:[
      fixture('initial',0,bi('Initial state is preserved','保留初始状态'),canvasInput([A],[]),canvasOutput([A])),
      fixture('add',0,bi('Add appends and records a change','添加并记录改变'),canvasInput([A],[command('add',{shape:B})]),canvasOutput([A,B],1)),
      fixture('move',0,bi('Move preserves size and order','移动保留尺寸与顺序'),canvasInput([A,B],[command('move',{id:'A',x:70,y:40})]),canvasOutput([movedA,B],1)),
      fixture('delete',0,bi('Delete only the matching shape','仅删除匹配图形'),canvasInput([A,B],[command('delete',{id:'A'})]),canvasOutput([B],1)),
      fixture('undo-add',1,bi('Undo an add','撤销添加'),canvasInput([A],[command('add',{shape:B}),command('undo')]),canvasOutput([A],0,1)),
      fixture('redo-add',1,bi('Redo an add','重做添加'),canvasInput([A],[command('add',{shape:B}),command('undo'),command('redo')]),canvasOutput([A,B],1)),
      fixture('empty-history',1,bi('Undo/redo on empty history','空历史撤销与重做'),canvasInput([A],[command('undo'),command('redo')]),canvasOutput([A])),
      fixture('undo-delete',1,bi('Undo restores original order','撤销删除恢复顺序'),canvasInput([A,B],[command('delete',{id:'A'}),command('undo')]),canvasOutput([A,B],0,1)),
      fixture('snapshot',2,bi('Undo move uses an independent snapshot','撤销移动须使用独立快照'),canvasInput([A],[command('move',{id:'A',x:70,y:40}),command('undo')]),canvasOutput([A],0,1)),
      fixture('branch',2,bi('A real edit invalidates redo','实际编辑清空重做'),canvasInput([A],[command('add',{shape:B}),command('undo'),command('move',{id:'A',x:70,y:40}),command('redo')]),canvasOutput([movedA],1)),
      fixture('noop-delete',2,bi('No-op deletion preserves redo','空删除保留重做'),canvasInput([A],[command('add',{shape:B}),command('undo'),command('delete',{id:'missing'}),command('redo')]),canvasOutput([A,B],1)),
      fixture('noop-move',2,bi('No-op move preserves redo','原地移动保留重做'),canvasInput([A],[command('add',{shape:B}),command('undo'),command('move',{id:'A',x:10,y:10}),command('redo')]),canvasOutput([A,B],1)),
      fixture('duplicate',2,bi('Duplicate IDs are a no-op','重复 ID 添加为空操作'),canvasInput([A],[command('add',{shape:rect('A',50,50)})]),canvasOutput([A])),
      fixture('two-undos',2,bi('Independent multiple snapshots','多个独立快照'),canvasInput([A],[command('move',{id:'A',x:30,y:30}),command('move',{id:'A',x:70,y:40}),command('undo'),command('undo')]),canvasOutput([A],0,2)),
      fixture('missing-move',2,bi('Moving a missing shape is a no-op','移动不存在图形为空操作'),canvasInput([A],[command('move',{id:'missing',x:20,y:20})]),canvasOutput([A])),
    ],
  },
];
export const getScenario=id=>scenarios.find(item=>item.id===id);
export const textFor=(value,locale)=>Array.isArray(value)?value[locale==='zh'?1:0]:value;

export function parseScenarioInput(item,text) {
  if(new TextEncoder().encode(text).length>8000)throw new Error('size');
  let v;try{v=JSON.parse(text);}catch{throw new Error('json');}
  const object=o=>o && typeof o==='object' && !Array.isArray(o);
  const exact=(o,keys)=>object(o)&&Object.keys(o).sort().join(',')===[...keys].sort().join(',');
  const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
  if(!exact(v,item.args))throw new Error('shape');
  let good=false;
  if(item.mode==='debug') {
    const g=v.grid;
    good=Array.isArray(g)&&g.length>=1&&g.length<=8&&g.every(row=>typeof row==='string'&&row.length>=1&&row.length<=8&&row.length===g[0].length&&/^[.#]+$/.test(row));
    if(good){
      const point=p=>Array.isArray(p)&&p.length===2&&integer(p[0],0,g.length-1)&&integer(p[1],0,g[0].length-1);
      const open=p=>point(p)&&g[p[0]][p[1]]==='.';
      good=point(v.start)&&point(v.goal)&&Array.isArray(v.portals)&&v.portals.length<=30&&v.portals.every(p=>Array.isArray(p)&&p.length===2&&p.every(open));
    }
  } else if(item.mode==='review') {
    good=integer(v.k,1,8)&&Array.isArray(v.requests)&&v.requests.length<=30&&v.requests.every((r,i)=>Array.isArray(r)&&r.length===2&&integer(r[0],0,100)&&integer(r[1],1,20)&&(i===0||r[0]>=v.requests[i-1][0]));
  } else {
    const id=s=>typeof s==='string'&&s.length>=1&&s.length<=32;
    const shape=s=>exact(s,['id','x','y','width','height'])&&id(s.id)&&integer(s.x,0,80)&&integer(s.y,0,80)&&integer(s.width,1,20)&&integer(s.height,1,20);
    const cmd=c=>object(c)&&(
      (c.op==='add'&&exact(c,['op','shape'])&&shape(c.shape))||
      (c.op==='move'&&exact(c,['op','id','x','y'])&&id(c.id)&&integer(c.x,0,80)&&integer(c.y,0,80))||
      (c.op==='delete'&&exact(c,['op','id'])&&id(c.id))||
      (['undo','redo'].includes(c.op)&&exact(c,['op'])));
    good=Array.isArray(v.initial)&&v.initial.length<=8&&v.initial.every(shape)&&new Set(v.initial.map(s=>s.id)).size===v.initial.length&&Array.isArray(v.commands)&&v.commands.length<=30&&v.commands.every(cmd);
  }
  if(!good)throw new Error('contract');
  return v;
}
const pyJson=v=>`json.loads(${JSON.stringify(JSON.stringify(v))})`;
const call=(item,scope='')=>`${scope}${item.signature.split('(')[0]}(${item.args.map(k=>`case[${JSON.stringify(k)}]`).join(', ')})`;
export function scenarioTest(item,fixture,locale='en') {
  return {name:textFor(fixture.name,locale),phase:fixture.phase,code:`import json, copy\ncase = ${pyJson(fixture.input)}\nuntouched = copy.deepcopy(case)\nexpected = ${pyJson(fixture.expected)}\nactual = ${call(item)}\nprint("TD_SCENARIO_RESULT=" + json.dumps({"actual": actual, "expected": expected}, ensure_ascii=True, allow_nan=False))\nassert json.dumps(case, sort_keys=True) == json.dumps(untouched, sort_keys=True), "Input was mutated"\nassert json.dumps(actual, sort_keys=True, allow_nan=False) == json.dumps(expected, sort_keys=True, allow_nan=False), "Actual output does not match the contract"`};
}
export function scenarioComparison(item,input) {
  return {name:'Experiment',code:`import json, copy\ncase = ${pyJson(input)}\nuntouched = copy.deepcopy(case)\nreference_scope = {"__name__": "__reference__"}\nexec(${JSON.stringify(item.reference)}, reference_scope, reference_scope)\nreference_fn = reference_scope[${JSON.stringify(item.signature.split('(')[0])}]\nexpected = reference_fn(${item.args.map(k=>`copy.deepcopy(case[${JSON.stringify(k)}])`).join(', ')})\ntry:\n    actual = ${call(item)}\n    mutated = json.dumps(case, sort_keys=True) != json.dumps(untouched, sort_keys=True)\n    different = mutated or json.dumps(actual, sort_keys=True, allow_nan=False) != json.dumps(expected, sort_keys=True, allow_nan=False)\n    observation = {"actual":actual, "expected":expected, "different":different, "mutated":mutated}\nexcept Exception as error:\n    observation = {"error":type(error).__name__ + ": " + str(error), "expected":expected, "different":True}\nprint("TD_SCENARIO_RESULT=" + json.dumps(observation, ensure_ascii=True, allow_nan=False))`};
}
