import { ICstVisitor } from "chevrotain";
import { AbstractTree, CronExpression, Expression, intervalExpr, rangeExpr, StringLiteral } from "../syntax/cron";
import {
  AtomicExprContext,
  CronContext,
  CronExpressionContext,
  ExpressionContext,
  ExprNotUnionContext,
  OperationContext
} from "./context";

/*eslint-disable @typescript-eslint/no-explicit-any */
const abstractVisitor = <T extends new (...args: any[]) => ICstVisitor<any, any>>(base: T) => {
  class AbstractVisitor extends base {
    constructor(...args: any[]) {
      super(args);

      this.validateVisitor();
    }

    cron(ctx: CronContext) {
      return this.visit(ctx.cronExpression);
    }

    cronExpression(ctx: CronExpressionContext) {
      const visitedContext = new CronExpression();
      visitedContext.minute = this.visit(ctx.minutes);
      visitedContext.hour = this.visit(ctx.hours);
      visitedContext.dom = this.visit(ctx.dom);
      visitedContext.month = this.visit(ctx.month);
      visitedContext.dow = this.visit(ctx.dow);
      return visitedContext;
    }

    expression(ctx: ExpressionContext) {
      const exprs = ctx.exprNotUnion.map(e => this.visit(e));
      return new Expression(exprs);
    }

    exprNotUnion(ctx: ExprNotUnionContext) {
      const lhs = new StringLiteral(ctx.lhs[0].image);
      return this.visit(ctx.atomicExpr, lhs);
    }

    atomicExpr(ctx: AtomicExprContext, lhs: StringLiteral) {
      let expr: AbstractTree = lhs;
      if (ctx.range) {
        const rhs = this.visit(ctx.range);
        const leftValue = Number(lhs.value());
        const rightValue = Number(rhs.value());
        if (leftValue !== NaN && rightValue !== NaN) {
          if (leftValue > rightValue) {
            throw new Error("Left-hand side range value must be smaller than right-hand side");
          }
        }
        expr = rangeExpr(lhs, rhs);
      }
      if (ctx.interval) {
        expr = intervalExpr(expr, this.visit(ctx.interval));
      }
      return expr;
    }

    interval(ctx: OperationContext) {
      return new StringLiteral(ctx.rhs[0].image);
    }

    range(ctx: OperationContext) {
      return new StringLiteral(ctx.rhs[0].image);
    }
  }

  return AbstractVisitor;
};

export default abstractVisitor;
