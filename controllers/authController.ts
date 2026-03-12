import * as UserModel from "../models/userModel.ts";

export const register = async (ctx: any) => {
  const body = await ctx.request.body({ type: "json" }).value;
  const { name, password, role } = body;
  if (!name || !password || !role) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Missing required fields" };
    return;
  }
  const prefix = role === "student" ? "S" : "T";
  const currentCount = UserModel.countRole(role);
  const newId = `${prefix}${101 + currentCount}`;
  UserModel.createUser(newId, name, password, role);
  ctx.response.body = { id: newId, name, role };
};

export const login = async (ctx: any) => {
  const body = await ctx.request.body({ type: "json" }).value;
  const { id, password } = body;
  if (!id || !password) {
    ctx.response.status = 400;
    ctx.response.body = { error: "ID and Password required" };
    return;
  }
  const role = id.startsWith("S")
    ? "student"
    : id.startsWith("T")
      ? "teacher"
      : null;
  if (!role) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Invalid ID format" };
    return;
  }
  const user = UserModel.findUserById(id, role);
  if (!user || user.password !== password) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Invalid ID or Password" };
    return;
  }
  ctx.response.body = { id: user.id, name: user.name, role: user.role };
};