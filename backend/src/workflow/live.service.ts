import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ChildProcess, spawn } from 'child_process';
import * as fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import * as path from 'path';
import * as net from 'net';

interface LiveWorkflowState {
  process: ChildProcess;
  port: number;
}

@Injectable()
export class LiveService implements OnModuleDestroy {
  private readonly logger = new Logger(LiveService.name);
  private activeWorkflows = new Map<string, LiveWorkflowState>();
  private readonly tempDir = path.join(process.cwd(), '.mcp-flow');

  constructor() {
    this.initTempDir();
  }

  private initTempDir() {
    try {
      if (!existsSync(this.tempDir)) {
        mkdirSync(this.tempDir, { recursive: true });
      }
    } catch (err) {
      this.logger.error(`Failed to create temp dir: ${err}`);
    }
  }

  async toggleLive(
    id: string,
    generatedCode: string,
    enable: boolean,
  ): Promise<number | null> {
    if (!enable) {
      this.stopLive(id);
      return null;
    }

    if (this.activeWorkflows.has(id)) {
      return this.activeWorkflows.get(id)!.port;
    }

    await fs.mkdir(this.tempDir, { recursive: true });
    const filePath = path.join(this.tempDir, `live-${id}.ts`);
    await fs.writeFile(filePath, generatedCode, 'utf-8');

    const port = await this.findFreePort();

    const env = {
      ...process.env,
      PORT: port.toString(),
      NODE_ENV: 'production',
      MCP_DEBUG_LEVEL: 'none',
    };

    return new Promise((resolve, reject) => {
      const spawnArgs = ['-y', 'ts-node', '--esm', `"${filePath}"`];
      const child = spawn('npx', spawnArgs, {
        env,
        shell: process.platform === 'win32',
      });

      child.stdout.on('data', (data: Buffer) => {
        const out = data.toString();
        if (out.includes(`MCP server running on port ${port}`)) {
          resolve(port);
        }
      });

      child.stderr.on('data', (data: Buffer) => {
        this.logger.error(`[Workflow ${id}] ${data.toString().trim()}`);
      });

      child.on('error', (err: Error) => {
        this.logger.error(
          `Failed to start live workflow ${id}: ${err.message}`,
        );
        reject(err);
      });

      child.on('exit', (code: number | null) => {
        this.logger.log(`Workflow ${id} process exited with code ${code}`);
        this.activeWorkflows.delete(id);
      });

      this.activeWorkflows.set(id, { process: child, port });

      setTimeout(() => {
        resolve(port);
      }, 3000);
    });
  }

  stopLive(id: string) {
    const state = this.activeWorkflows.get(id);
    if (state) {
      this.logger.log(`Stopping live workflow ${id} on port ${state.port}`);
      if (process.platform === 'win32') {
        if (state.process.pid) {
          spawn('taskkill', ['/pid', state.process.pid.toString(), '/f', '/t']);
        }
      } else {
        state.process.kill('SIGTERM');
      }
      this.activeWorkflows.delete(id);
    }
  }

  getLivePort(id: string): number | null {
    return this.activeWorkflows.get(id)?.port || null;
  }

  private findFreePort(): Promise<number> {
    return new Promise((resolve, reject) => {
      const srv = net.createServer();
      srv.listen(0, () => {
        const addr = srv.address();
        const port = typeof addr === 'object' && addr ? addr.port : 0;
        srv.close((err) => {
          if (err) reject(err);
          else resolve(port);
        });
      });
    });
  }

  onModuleDestroy() {
    for (const id of this.activeWorkflows.keys()) {
      this.stopLive(id);
    }
  }
}
