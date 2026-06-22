# LaTeX 课程报告

这个目录提供基于“华中科技大学研究生课程报告”模板改写的课程设计报告源码。

## 文件说明

- `main.tex`：课程报告正文
- `references.bib`：参考文献
- `HustGSClassPaper.cls`：模板类文件
- `figures/`：报告插图

## 编译方式

在当前目录执行：

```bash
xelatex main.tex
bibtex main
xelatex main.tex
xelatex main.tex
```

生成结果：

- `main.pdf`

## 使用说明

提交前建议把以下信息替换为你自己的：

- 学号
- 作者姓名
- 专业班级
- 指导教师
- 院系名称
