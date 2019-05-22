import { ICstVisitor } from "chevrotain";
import {
  ICronContext,
  ICronExpressionContext,
  IExpressionContext,
  IExprNotUnionContext,
  IAtomicExprContext,
  IOperationContext
} from "./context";
import { CronExpression, Expression, StringLiteral, AbstractTree, rangeExpr, intervalExpr } from "src/syntax/base";

const abstractVisitor = <T extends new (...args: any[]) => ICstVisitor<any, any>>(base: T) => {
  class AbstractVisitor extends base {
    constructor(...args: any[]) {
      super(args);

      this.validateVisitor();
    }

    cron(ctx: ICronContext) {
      return this.visit(ctx.cronExpression);
    }

    cronExpression(ctx: ICronExpressionContext) {
      const visitedContext = new CronExpression();
      visitedContext.minute = this.visit(ctx.minutes);
      visitedContext.hour = this.visit(ctx.hours);
      visitedContext.dom = this.visit(ctx.dom);
      visitedContext.month = this.visit(ctx.month);
      visitedContext.dow = this.visit(ctx.dow);
      return visitedContext;
    }

    expression(ctx: IExpressionContext) {
      const exprs = ctx.exprNotUnion.map(e => this.visit(e));
      return new Expression(exprs);
    }

    exprNotUnion(ctx: IExprNotUnionContext) {
      const lhs = new StringLiteral(ctx.lhs[0].image);
      return this.visit(ctx.atomicExpr, lhs);
    }

    atomicExpr(ctx: IAtomicExprContext, lhs: StringLiteral) {
      let expr: AbstractTree = lhs;
      if (ctx.range) {
        expr = rangeExpr(lhs, this.visit(ctx.range));
      }
      if (ctx.interval) {
        expr = intervalExpr(expr, this.visit(ctx.interval));
      }
      return expr;
    }

    interval(ctx: IOperationContext) {
      return new StringLiteral(ctx.rhs[0].image);
    }

    range(ctx: IOperationContext) {
      return new StringLiteral(ctx.rhs[0].image);
    }
  }

  return AbstractVisitor;
};

export default abstractVisitor;
