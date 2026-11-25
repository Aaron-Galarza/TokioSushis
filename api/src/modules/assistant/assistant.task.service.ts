import { randomUUID } from 'crypto';
import { Request } from 'express';
import { AssistantTask, OperationStatus, TaskStatus } from './assistant.task.model';
import { checkOperationPrecondition, executeOperation, PreparedOperation, verifyOperation } from './assistant.executor';

export const createTask = async (userId: string, objective: string, operations: PreparedOperation[]) => AssistantTask.create({
  userId, objective: objective.trim(), status: 'pending', expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  operations: operations.map((operation) => ({ id: randomUUID(), action: operation.name, resourceId: operation.resolvedTarget,
    parameters: { method: operation.method, path: operation.path, body: operation.body }, previousValues: operation.previousValues, expectedValues: operation.body, status: 'pending' })),
});

const deriveStatus = (statuses: OperationStatus[]): TaskStatus => {
  if (statuses.every((status) => status === 'verified' || status === 'completed')) return 'completed';
  if (statuses.some((status) => status === 'verified' || status === 'completed') && statuses.some((status) => ['failed', 'conflict', 'uncertain'].includes(status))) return 'partial';
  if (statuses.every((status) => status === 'failed' || status === 'conflict' || status === 'uncertain')) return 'failed';
  return 'running';
};

export const runTask = async (req: Request, taskId: string, userId: string) => {
  const task = await AssistantTask.findOneAndUpdate({ _id: taskId, userId, status: 'pending', expiresAt: { $gt: new Date() } }, { $set: { status: 'running', approvedAt: new Date() } }, { new: true });
  if (!task) throw new Error('La tarea venció, fue cancelada, ya se procesó o no pertenece al administrador.');
  for (const operation of task.operations) {
    if (operation.status !== 'pending') continue;
    operation.status = 'running'; operation.startedAt = new Date(); await task.save();
    try {
      const prepared = { name: operation.action, method: operation.parameters.method, path: operation.parameters.path, body: operation.parameters.body, write: true, description: operation.action, resolvedTarget: operation.resourceId } as PreparedOperation;
      (prepared as PreparedOperation & { previousValues?: Record<string, unknown> }).previousValues = operation.previousValues;
      if (!(await checkOperationPrecondition(req, prepared))) { operation.status = 'conflict'; operation.error = 'El registro cambió desde la preparación de la tarea.'; operation.completedAt = new Date(); await task.save(); continue; }
      operation.result = await executeOperation(req, prepared);
      const verified = await verifyOperation(req, prepared);
      operation.status = verified ? 'verified' : 'uncertain';
      if (!verified) operation.error = 'La API respondió, pero no se pudo verificar el valor esperado.';
    } catch (error) { operation.status = 'failed'; operation.error = error instanceof Error ? error.message : 'La operación falló.'; }
    operation.completedAt = new Date(); await task.save();
  }
  task.status = deriveStatus(task.operations.map((operation) => operation.status as OperationStatus)); task.completedAt = new Date(); await task.save();
  return task;
};

export const cancelTask = async (taskId: string, userId: string) => AssistantTask.findOneAndUpdate({ _id: taskId, userId, status: 'pending', expiresAt: { $gt: new Date() } }, { $set: { status: 'cancelled' } }, { new: true });
