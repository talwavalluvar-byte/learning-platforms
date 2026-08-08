/* ----------------------------------------------------
   DEVBASE2 - COURSE CURRICULUM & VISUAL STEP DATA
   Log2Base2 Inspired Developer Courses & Memory Models
   ---------------------------------------------------- */

const GDRIVE_FOLDER = "https://drive.google.com/drive/folders/1rAvw1BoASyXIMeMw99oSzyKLCqjBvbib?usp=sharing";

export const COURSES = [
  {
    id: "c-programming-mastery",
    title: "C Programming (Complete Log2Base2 Course)",
    category: "c-prog",
    tagLabel: "C Programming",
    tagClass: "c-prog",
    description: "Master C programming visually from absolute basics, variables, printf/scanf to pointers, memory addresses, and dynamic allocation.",
    level: "Beginner to Advanced",
    lessonsCount: 22,
    duration: "3.5 hrs",
    icon: "cpu",
    modules: [
      {
        id: "c-mod-intro",
        title: "Introduction to C",
        lessons: [
          {
            id: "c-intro-1",
            title: "Introduction to C Programming",
            duration: "5 mins",
            videoUrl: GDRIVE_FOLDER,
            summary: "Learn what C is, how source code is compiled into machine instructions, and basic program structure.",
            codeSnippet: `#include <stdio.h>

int main() {
    // Welcome to C Programming!
    printf("Welcome to Log2Base2 Visual C Course!\\n");
    return 0;
}`,
            language: "c",
            steps: [
              {
                stepNum: 1,
                explanation: "Execution enters main() function. Program entry point loaded into memory.",
                codeLine: 4,
                memoryState: {
                  stack: [
                    { addr: "0x7ffe00", name: "main()", val: "Active Frame", type: "function" }
                  ],
                  heap: []
                }
              },
              {
                stepNum: 2,
                explanation: "printf() outputs string to standard console output.",
                codeLine: 5,
                memoryState: {
                  stack: [
                    { addr: "0x7ffe00", name: "main()", val: "Executing printf()", type: "function", highlighted: true }
                  ],
                  heap: []
                }
              }
            ],
            quiz: [
              {
                id: "q_intro_1",
                question: "What is the entry point function of every C program?",
                options: ["start()", "main()", "init()", "printf()"],
                answer: 1,
                explanation: "In C, execution always begins at the main() function."
              }
            ]
          }
        ]
      },
      {
        id: "c-mod-getstarted",
        title: "Get Started in C",
        lessons: [
          {
            id: "c-gs-1",
            title: "Printf in C",
            duration: "8 mins",
            videoUrl: GDRIVE_FOLDER,
            summary: "Understand how printf works to display text and formatted outputs to the screen.",
            codeSnippet: `#include <stdio.h>

int main() {
    printf("Hello World\\n");
    printf("Learning C Visually!\\n");
    return 0;
}`,
            language: "c",
            steps: [
              {
                stepNum: 1,
                explanation: "First printf statement prints 'Hello World' followed by newline character \\n.",
                codeLine: 4,
                memoryState: {
                  stack: [{ addr: "0x7ffe00", name: "Output Buffer", val: "Hello World", type: "stdout", highlighted: true }],
                  heap: []
                }
              },
              {
                stepNum: 2,
                explanation: "Second printf statement prints 'Learning C Visually!'.",
                codeLine: 5,
                memoryState: {
                  stack: [{ addr: "0x7ffe00", name: "Output Buffer", val: "Hello World\\nLearning C Visually!", type: "stdout", highlighted: true }],
                  heap: []
                }
              }
            ],
            quiz: [
              {
                id: "q_gs_1",
                question: "What does the escape sequence '\\n' do in printf?",
                options: ["Prints a tab space", "Moves output to a new line", "Terminates the program", "Prints a backslash"],
                answer: 1,
                explanation: "'\\n' is the newline escape character in C."
              }
            ]
          },
          {
            id: "c-gs-2",
            title: "Escape Sequence in C",
            duration: "6 mins",
            videoUrl: GDRIVE_FOLDER,
            summary: "Learn escape sequences like \\n (newline), \\t (tab space), and \\\\ (backslash).",
            codeSnippet: `#include <stdio.h>

int main() {
    printf("Item\\tPrice\\n");
    printf("Apple\\t$2\\n");
    return 0;
}`,
            language: "c",
            steps: [
              {
                stepNum: 1,
                explanation: "\\t inserts horizontal tab alignment between columns.",
                codeLine: 4,
                memoryState: {
                  stack: [{ addr: "0x7ffe00", name: "Console", val: "Item    Price", type: "stdout", highlighted: true }],
                  heap: []
                }
              }
            ],
            quiz: [
              {
                id: "q_gs_2",
                question: "Which escape sequence creates a horizontal tab space?",
                options: ["\\n", "\\t", "\\b", "\\r"],
                answer: 1,
                explanation: "\\t produces a tab space in C output streams."
              }
            ]
          },
          {
            id: "c-gs-3",
            title: "Data Types in C",
            duration: "10 mins",
            videoUrl: GDRIVE_FOLDER,
            summary: "Explore primitive C data types: int (4 bytes), float (4 bytes), double (8 bytes), and char (1 byte).",
            codeSnippet: `#include <stdio.h>

int main() {
    int age = 25;
    float salary = 4500.50;
    char grade = 'A';
    
    printf("Age: %d, Grade: %c\\n", age, grade);
    return 0;
}`,
            language: "c",
            steps: [
              {
                stepNum: 1,
                explanation: "int age allocated (4 bytes) at 0x7ffe04 with value 25.",
                codeLine: 4,
                memoryState: {
                  stack: [
                    { addr: "0x7ffe04", name: "age", val: "25", type: "int" },
                    { addr: "0x7ffe08", name: "salary", val: "4500.50", type: "float" },
                    { addr: "0x7ffe0c", name: "grade", val: "'A'", type: "char" }
                  ],
                  heap: []
                }
              }
            ],
            quiz: [
              {
                id: "q_gs_3",
                question: "How many bytes does a char data type consume in C memory?",
                options: ["1 byte", "2 bytes", "4 bytes", "8 bytes"],
                answer: 0,
                explanation: "A char variable occupies exactly 1 byte (8 bits) of memory."
              }
            ]
          },
          {
            id: "c-gs-4",
            title: "Variables in C",
            duration: "10 mins",
            videoUrl: GDRIVE_FOLDER,
            summary: "Learn how variables act as named memory containers storing data values.",
            codeSnippet: `#include <stdio.h>

int main() {
    int x = 10;
    int y = 20;
    int sum = x + y;
    
    printf("Sum = %d\\n", sum);
    return 0;
}`,
            language: "c",
            steps: [
              {
                stepNum: 1,
                explanation: "Variables x (10) and y (20) created in Stack Frame.",
                codeLine: 4,
                memoryState: {
                  stack: [
                    { addr: "0x7ffe00", name: "x", val: "10", type: "int" },
                    { addr: "0x7ffe04", name: "y", val: "20", type: "int" }
                  ],
                  heap: []
                }
              },
              {
                stepNum: 2,
                explanation: "ALU evaluates 10 + 20 = 30 and stores result in variable sum at 0x7ffe08.",
                codeLine: 6,
                memoryState: {
                  stack: [
                    { addr: "0x7ffe00", name: "x", val: "10", type: "int" },
                    { addr: "0x7ffe04", name: "y", val: "20", type: "int" },
                    { addr: "0x7ffe08", name: "sum", val: "30", type: "int", highlighted: true }
                  ],
                  heap: []
                }
              }
            ],
            quiz: [
              {
                id: "q_gs_4",
                question: "Which format specifier is used to print an integer in C?",
                options: ["%f", "%c", "%d", "%s"],
                answer: 2,
                explanation: "%d (or %i) is used for signed integer formatting in printf."
              }
            ]
          },
          {
            id: "c-gs-5",
            title: "Constant in C",
            duration: "6 mins",
            videoUrl: GDRIVE_FOLDER,
            summary: "Understand const qualifier and #define macros to create read-only immutable values.",
            codeSnippet: `#include <stdio.h>
#define PI 3.14159

int main() {
    const int MAX_USERS = 100;
    printf("Max Users: %d, PI: %.2f\\n", MAX_USERS, PI);
    return 0;
}`,
            language: "c",
            steps: [
              {
                stepNum: 1,
                explanation: "const int MAX_USERS marked read-only. Modifying it causes compilation error.",
                codeLine: 5,
                memoryState: {
                  stack: [
                    { addr: "0x7ffe00", name: "MAX_USERS", val: "100 (const)", type: "const int", highlighted: true }
                  ],
                  heap: []
                }
              }
            ],
            quiz: [
              {
                id: "q_gs_5",
                question: "What happens if you attempt to assign a new value to a const variable?",
                options: ["Value changes silently", "Compilation error occurs", "Program runs with warning", "Variable moves to heap"],
                answer: 1,
                explanation: "The C compiler throws a read-only variable assignment compilation error."
              }
            ]
          },
          {
            id: "c-gs-6",
            title: "How to Print the Value of a Variable?",
            duration: "7 mins",
            videoUrl: GDRIVE_FOLDER,
            summary: "Learn format specifiers (%d, %f, %c, %s, %p) to print variables and memory locations.",
            codeSnippet: `#include <stdio.h>

int main() {
    int count = 5;
    double score = 98.5;
    printf("Count = %d, Score = %.1f\\n", count, score);
    return 0;
}`,
            language: "c",
            steps: [
              {
                stepNum: 1,
                explanation: "%d replaced by count (5) and %.1f replaced by score (98.5).",
                codeLine: 6,
                memoryState: {
                  stack: [
                    { addr: "0x7ffe00", name: "count", val: "5", type: "int" },
                    { addr: "0x7ffe08", name: "score", val: "98.5", type: "double" }
                  ],
                  heap: []
                }
              }
            ],
            quiz: [
              {
                id: "q_gs_6",
                question: "Which specifier is used for double precision floating point variables?",
                options: ["%d", "%lf", "%c", "%u"],
                answer: 1,
                explanation: "%lf (long float) is used for double precision float variables."
              }
            ]
          },
          {
            id: "c-gs-7",
            title: "Scanf Function",
            duration: "10 mins",
            videoUrl: GDRIVE_FOLDER,
            summary: "Use scanf() with address-of operator (&) to take user input from keyboard into memory.",
            codeSnippet: `#include <stdio.h>

int main() {
    int userAge;
    printf("Enter your age: ");
    scanf("%d", &userAge); // Stores input at &userAge memory address
    printf("You entered: %d\\n", userAge);
    return 0;
}`,
            language: "c",
            steps: [
              {
                stepNum: 1,
                explanation: "Memory space allocated for userAge at 0x7ffe10 (uninitialized garbage value).",
                codeLine: 4,
                memoryState: {
                  stack: [
                    { addr: "0x7ffe10", name: "userAge", val: "?", type: "int" }
                  ],
                  heap: []
                }
              },
              {
                stepNum: 2,
                explanation: "scanf reading input from stdin and storing value into address 0x7ffe10.",
                codeLine: 6,
                memoryState: {
                  stack: [
                    { addr: "0x7ffe10", name: "userAge", val: "22", type: "int", highlighted: true }
                  ],
                  heap: []
                }
              }
            ],
            quiz: [
              {
                id: "q_gs_7",
                question: "Why must we pass &userAge to scanf(\"%d\", &userAge)?",
                options: [
                  "To multiply userAge by 10",
                  "To pass the memory address where scanf should write the input",
                  "To make userAge constant",
                  "To clear the console buffer"
                ],
                answer: 1,
                explanation: "scanf needs the memory address (& operator) of the variable to store the entered value."
              }
            ]
          }
        ]
      },
      {
        id: "c-mod-operators",
        title: "Operators in C",
        lessons: [
          {
            id: "c-op-1",
            title: "Arithmetic Operators",
            duration: "8 mins",
            videoUrl: GDRIVE_FOLDER,
            summary: "Master addition (+), subtraction (-), multiplication (*), division (/), and modulus (%).",
            codeSnippet: `#include <stdio.h>

int main() {
    int a = 17, b = 5;
    int div = a / b;
    int rem = a % b; // Modulus gives remainder
    printf("17 / 5 = %d, 17 %% 5 = %d\\n", div, rem);
    return 0;
}`,
            language: "c",
            steps: [
              {
                stepNum: 1,
                explanation: "Integer division 17 / 5 truncates decimal part to 3. Modulus 17 % 5 yields remainder 2.",
                codeLine: 5,
                memoryState: {
                  stack: [
                    { addr: "0x7ffe00", name: "div", val: "3", type: "int" },
                    { addr: "0x7ffe04", name: "rem", val: "2", type: "int", highlighted: true }
                  ],
                  heap: []
                }
              }
            ],
            quiz: [
              {
                id: "q_op_1",
                question: "What is the output of 10 % 3 in C?",
                options: ["3", "1", "3.33", "0"],
                answer: 1,
                explanation: "10 divided by 3 has a remainder of 1 (10 = 3*3 + 1)."
              }
            ]
          },
          {
            id: "c-op-2",
            title: "Relational & Logical Operators",
            duration: "10 mins",
            videoUrl: GDRIVE_FOLDER,
            summary: "Understand boolean evaluations with ==, !=, >, <, >=, <=, && (AND), || (OR), ! (NOT).",
            codeSnippet: `#include <stdio.h>

int main() {
    int age = 20;
    int hasID = 1;
    
    if (age >= 18 && hasID) {
        printf("Access Granted\\n");
    }
    return 0;
}`,
            language: "c",
            steps: [
              {
                stepNum: 1,
                explanation: "Evaluates (age >= 18) -> True (1) AND (hasID == 1) -> True (1). Result is True (1).",
                codeLine: 7,
                memoryState: {
                  stack: [
                    { addr: "0x7ffe00", name: "age", val: "20", type: "int" },
                    { addr: "0x7ffe04", name: "hasID", val: "1", type: "int" }
                  ],
                  heap: []
                }
              }
            ],
            quiz: [
              {
                id: "q_op_2",
                question: "What does the logical AND operator (&&) evaluate to if the first operand is 0 (false)?",
                options: ["Evaluates second operand", "Evaluates to 0 (Short-circuit)", "Throws syntax error", "Evaluates to 1"],
                answer: 1,
                explanation: "Logical AND short-circuits to 0 (false) immediately if the left condition is false."
              }
            ]
          }
        ]
      },
      {
        id: "c-mod-decision",
        title: "Decision Making in C",
        lessons: [
          {
            id: "c-dec-1",
            title: "If Statement & If-Else",
            duration: "10 mins",
            videoUrl: GDRIVE_FOLDER,
            summary: "Control execution flow using conditional branching: if, else, and nested blocks.",
            codeSnippet: `#include <stdio.h>

int main() {
    int num = 15;
    if (num % 2 == 0) {
        printf("%d is Even\\n", num);
    } else {
        printf("%d is Odd\\n", num);
    }
    return 0;
}`,
            language: "c",
            steps: [
              {
                stepNum: 1,
                explanation: "15 % 2 == 1 (false). Execution jumps to the 'else' branch.",
                codeLine: 7,
                memoryState: {
                  stack: [
                    { addr: "0x7ffe00", name: "num", val: "15", type: "int", highlighted: true }
                  ],
                  heap: []
                }
              }
            ],
            quiz: [
              {
                id: "q_dec_1",
                question: "Which block executes when the condition in an if statement evaluates to 0?",
                options: ["The if block", "The else block", "Both blocks", "Neither block"],
                answer: 1,
                explanation: "In C, 0 represents false, so execution shifts to the else block."
              }
            ]
          },
          {
            id: "c-dec-2",
            title: "Switch Case Statement",
            duration: "12 mins",
            videoUrl: GDRIVE_FOLDER,
            summary: "Learn multi-way branching with switch, case labels, break statements, and default cases.",
            codeSnippet: `#include <stdio.h>

int main() {
    int day = 2;
    switch(day) {
        case 1: printf("Monday\\n"); break;
        case 2: printf("Tuesday\\n"); break;
        default: printf("Other Day\\n");
    }
    return 0;
}`,
            language: "c",
            steps: [
              {
                stepNum: 1,
                explanation: "day == 2 matches case 2. Prints 'Tuesday' and break exits switch block.",
                codeLine: 7,
                memoryState: {
                  stack: [
                    { addr: "0x7ffe00", name: "day", val: "2", type: "int", highlighted: true }
                  ],
                  heap: []
                }
              }
            ],
            quiz: [
              {
                id: "q_dec_2",
                question: "What happens if a 'break' statement is omitted at the end of a matching case?",
                options: ["Syntax error occurs", "Fall-through to subsequent cases occurs", "Program terminates", "Loops endlessly"],
                answer: 1,
                explanation: "Without a break statement, C falls through and executes following case blocks."
              }
            ]
          }
        ]
      },
      {
        id: "c-mod-loops",
        title: "Loops in C",
        lessons: [
          {
            id: "c-loop-1",
            title: "While Loop & For Loop",
            duration: "12 mins",
            videoUrl: GDRIVE_FOLDER,
            summary: "Automate repetitive tasks with while, for, and do-while iteration constructs.",
            codeSnippet: `#include <stdio.h>

int main() {
    for (int i = 1; i <= 3; i++) {
        printf("Iteration %d\\n", i);
    }
    return 0;
}`,
            language: "c",
            steps: [
              {
                stepNum: 1,
                explanation: "Loop counter i initialized to 1. Condition 1 <= 3 holds true.",
                codeLine: 4,
                memoryState: {
                  stack: [{ addr: "0x7ffe00", name: "i", val: "1", type: "int", highlighted: true }],
                  heap: []
                }
              },
              {
                stepNum: 2,
                explanation: "i incremented to 2. Condition 2 <= 3 holds true.",
                codeLine: 4,
                memoryState: {
                  stack: [{ addr: "0x7ffe00", name: "i", val: "2", type: "int", highlighted: true }],
                  heap: []
                }
              },
              {
                stepNum: 3,
                explanation: "i incremented to 4. Condition 4 <= 3 is False. Loop terminates.",
                codeLine: 4,
                memoryState: {
                  stack: [{ addr: "0x7ffe00", name: "i", val: "4", type: "int" }],
                  heap: []
                }
              }
            ],
            quiz: [
              {
                id: "q_loop_1",
                question: "Which loop guarantees execution of its body at least once?",
                options: ["for loop", "while loop", "do-while loop", "nested loop"],
                answer: 2,
                explanation: "do-while loops check the exit condition after executing the body once."
              }
            ]
          }
        ]
      },
      {
        id: "c-mod-bitwise",
        title: "Bitwise Operators in C",
        lessons: [
          {
            id: "c-bit-1",
            title: "Bitwise AND, OR, XOR & Shifts",
            duration: "10 mins",
            videoUrl: GDRIVE_FOLDER,
            summary: "Manipulate individual binary bits using &, |, ^, ~, << (left shift), and >> (right shift).",
            codeSnippet: `#include <stdio.h>

int main() {
    int a = 5; // 0101 in binary
    int b = 3; // 0011 in binary
    
    int andResult = a & b; // 0001 (1)
    int shiftResult = a << 1; // 1010 (10)
    
    printf("5 & 3 = %d, 5 << 1 = %d\\n", andResult, shiftResult);
    return 0;
}`,
            language: "c",
            steps: [
              {
                stepNum: 1,
                explanation: "0101 AND 0011 bit-by-bit yields 0001 (1). 5 left shifted by 1 multiplies 5 by 2 -> 10.",
                codeLine: 7,
                memoryState: {
                  stack: [
                    { addr: "0x7ffe00", name: "andResult", val: "1", type: "int" },
                    { addr: "0x7ffe04", name: "shiftResult", val: "10", type: "int", highlighted: true }
                  ],
                  heap: []
                }
              }
            ],
            quiz: [
              {
                id: "q_bit_1",
                question: "What is the result of left-shifting an integer by 1 bit (x << 1)?",
                options: ["Divides x by 2", "Multiplies x by 2", "Adds 1 to x", "Inverts all bits"],
                answer: 1,
                explanation: "Left shift by 1 position (x << 1) effectively multiplies the binary integer by 2."
              }
            ]
          }
        ]
      },
      {
        id: "c-mod-functions",
        title: "Functions",
        lessons: [
          {
            id: "c-func-1",
            title: "User Defined Functions & Memory Stack",
            duration: "12 mins",
            videoUrl: GDRIVE_FOLDER,
            summary: "Understand function call stack frames, parameters, return values, and scope.",
            codeSnippet: `#include <stdio.h>

int add(int a, int b) {
    return a + b;
}

int main() {
    int res = add(10, 20);
    printf("Result = %d\\n", res);
    return 0;
}`,
            language: "c",
            steps: [
              {
                stepNum: 1,
                explanation: "main() pushes new stack frame for add(10, 20) with parameters a=10, b=20.",
                codeLine: 8,
                memoryState: {
                  stack: [
                    { addr: "0x7ffe00", name: "main()", val: "Stack Frame", type: "function" },
                    { addr: "0x7ffdf0", name: "add(a=10, b=20)", val: "Active Frame", type: "function", highlighted: true }
                  ],
                  heap: []
                }
              },
              {
                stepNum: 2,
                explanation: "add() returns 30. Stack frame for add() popped off memory stack.",
                codeLine: 4,
                memoryState: {
                  stack: [
                    { addr: "0x7ffe00", name: "main()", val: "res = 30", type: "function" }
                  ],
                  heap: []
                }
              }
            ],
            quiz: [
              {
                id: "q_func_1",
                question: "What memory region manages function call frames and local variables?",
                options: ["Heap", "Stack", "Data Segment", "BSS Segment"],
                answer: 1,
                explanation: "The Stack memory segment dynamically grows and shrinks with function calls and returns."
              }
            ]
          },
          {
            id: "c-func-2",
            title: "Call By Value vs Call by Reference",
            duration: "12 mins",
            videoUrl: GDRIVE_FOLDER,
            summary: "Learn how values are copied in Call by Value vs memory addresses in Call by Reference.",
            codeSnippet: `#include <stdio.h>

void set(int a) {
    a = 0;
    printf("in set function a = %d\\n", a);
}

int main() {
    int a = 10;
    printf("before calling function a = %d\\n", a);
    set(a);
    printf("after calling function a = %d\\n", a);
    return 0;
}`,
            language: "c",
            steps: [
              {
                stepNum: 1,
                explanation: "main() initializes variable a = 10 at address 1024.",
                codeLine: 9,
                memoryState: {
                  stack: [
                    { addr: "1024", name: "main() a", val: "10", type: "int" }
                  ],
                  heap: []
                }
              },
              {
                stepNum: 2,
                explanation: "set(a) creates a separate copy of variable 'a' in set() stack frame at address 2024.",
                codeLine: 11,
                memoryState: {
                  stack: [
                    { addr: "1024", name: "main() a", val: "10", type: "int" },
                    { addr: "2024", name: "set() a", val: "0", type: "int", highlighted: true }
                  ],
                  heap: []
                }
              }
            ],
            quiz: [
              {
                id: "q_func_2",
                question: "In Call by Value, modifications inside the called function affect the original main variable:",
                options: ["False, changes only affect local copy", "True, original variable changes", "It causes compilation error", "It creates heap memory"],
                answer: 0,
                explanation: "In Call by Value, a copy of the argument is passed, so changes do not affect the caller variable."
              }
            ]
          }
        ]
      },
      {
        id: "c-mod-pointers",
        title: "Pointers in C",
        lessons: [
          {
            id: "c-ptr-1",
            title: "Understanding Variable Storage & Addresses",
            duration: "10 mins",
            videoUrl: GDRIVE_FOLDER,
            summary: "Learn how variables are allocated in physical RAM memory with hexadecimal addresses.",
            codeSnippet: `#include <stdio.h>

int main() {
    int x = 10;
    int y = 20;
    
    printf("Value of x = %d\\n", x);
    printf("Address of x = %p\\n", (void*)&x);
    
    return 0;
}`,
            language: "c",
            steps: [
              {
                stepNum: 1,
                explanation: "Execution starts. Memory region allocated for local variables inside Stack Frame.",
                codeLine: 4,
                memoryState: {
                  stack: [
                    { addr: "0x7ffe00", name: "x", val: "10", type: "int" }
                  ],
                  heap: []
                }
              },
              {
                stepNum: 2,
                explanation: "Variable 'y' declared. Stack allocated at address 0x7ffe04.",
                codeLine: 5,
                memoryState: {
                  stack: [
                    { addr: "0x7ffe00", name: "x", val: "10", type: "int" },
                    { addr: "0x7ffe04", name: "y", val: "20", type: "int" }
                  ],
                  heap: []
                }
              },
              {
                stepNum: 3,
                explanation: "The & (address-of) operator retrieves memory location address 0x7ffe00.",
                codeLine: 8,
                memoryState: {
                  stack: [
                    { addr: "0x7ffe00", name: "x", val: "10", type: "int", highlighted: true },
                    { addr: "0x7ffe04", name: "y", val: "20", type: "int" }
                  ],
                  heap: []
                }
              }
            ],
            quiz: [
              {
                id: "q_ptr_1",
                question: "What does the & operator do in C when prefixed to a variable name (e.g. &x)?",
                options: [
                  "It returns the value stored inside x",
                  "It returns the physical memory address where x is stored",
                  "It creates a duplicate copy of x in Heap memory",
                  "It performs a logical AND operation"
                ],
                answer: 1,
                explanation: "The address-of operator '&' extracts the memory address (hexadecimal value) of a variable."
              }
            ]
          },
          {
            id: "c-ptr-2",
            title: "Pointer Variables & Dereferencing (*ptr)",
            duration: "12 mins",
            videoUrl: GDRIVE_FOLDER,
            summary: "Master pointer declaration, storing addresses, and changing values using dereferencing.",
            codeSnippet: `#include <stdio.h>

int main() {
    int num = 50;
    int *ptr = &num; // ptr stores address of num
    
    *ptr = 99; // Dereferencing: changes value of num to 99
    
    printf("num = %d\\n", num);
    return 0;
}`,
            language: "c",
            steps: [
              {
                stepNum: 1,
                explanation: "Variable 'num' assigned value 50 at stack address 0x7ffe10.",
                codeLine: 4,
                memoryState: {
                  stack: [
                    { addr: "0x7ffe10", name: "num", val: "50", type: "int" }
                  ],
                  heap: []
                }
              },
              {
                stepNum: 2,
                explanation: "Pointer 'ptr' allocated at 0x7ffe18. It stores address 0x7ffe10 (points to num).",
                codeLine: 5,
                memoryState: {
                  stack: [
                    { addr: "0x7ffe10", name: "num", val: "50", type: "int" },
                    { addr: "0x7ffe18", name: "ptr", val: "0x7ffe10", type: "int*", pointsTo: "0x7ffe10", highlighted: true }
                  ],
                  heap: []
                }
              },
              {
                stepNum: 3,
                explanation: "*ptr dereferencing modifies num's value at 0x7ffe10 to 99!",
                codeLine: 7,
                memoryState: {
                  stack: [
                    { addr: "0x7ffe10", name: "num", val: "99", type: "int", highlighted: true },
                    { addr: "0x7ffe18", name: "ptr", val: "0x7ffe10", type: "int*", pointsTo: "0x7ffe10" }
                  ],
                  heap: []
                }
              }
            ],
            quiz: [
              {
                id: "q_ptr_2",
                question: "If int *ptr = &num and num = 50, what does *ptr evaluate to?",
                options: ["The address of ptr", "50 (the value stored in num)", "NULL", "The address of num"],
                answer: 1,
                explanation: "*ptr dereferences the pointer to access the value stored at the target memory address."
              }
            ]
          }
        ]
      },
      {
        id: "c-mod-dma",
        title: "Dynamic Memory Allocation",
        lessons: [
          {
            id: "c-dma-1",
            title: "malloc & Heap Memory Allocation",
            duration: "15 mins",
            videoUrl: GDRIVE_FOLDER,
            summary: "Visualizing heap memory allocation dynamically at runtime using malloc and freeing memory.",
            codeSnippet: `#include <stdio.h>
#include <stdlib.h>

int main() {
    int *arr = (int*) malloc(3 * sizeof(int));
    arr[0] = 10;
    arr[1] = 20;
    arr[2] = 30;

    free(arr); // Prevent memory leak
    return 0;
}`,
            language: "c",
            steps: [
              {
                stepNum: 1,
                explanation: "malloc allocates space for 3 integers (12 bytes) in HEAP memory at 0x900000.",
                codeLine: 5,
                memoryState: {
                  stack: [
                    { addr: "0x7ffe20", name: "arr", val: "0x900000", type: "int*", pointsTo: "0x900000" }
                  ],
                  heap: [
                    { addr: "0x900000", name: "arr[0]", val: "0", type: "int" },
                    { addr: "0x900004", name: "arr[1]", val: "0", type: "int" },
                    { addr: "0x900008", name: "arr[2]", val: "0", type: "int" }
                  ]
                }
              },
              {
                stepNum: 2,
                explanation: "Heap memory cells populated: arr[0]=10, arr[1]=20, arr[2]=30.",
                codeLine: 8,
                memoryState: {
                  stack: [
                    { addr: "0x7ffe20", name: "arr", val: "0x900000", type: "int*", pointsTo: "0x900000" }
                  ],
                  heap: [
                    { addr: "0x900000", name: "arr[0]", val: "10", type: "int", highlighted: true },
                    { addr: "0x900004", name: "arr[1]", val: "20", type: "int", highlighted: true },
                    { addr: "0x900008", name: "arr[2]", val: "30", type: "int", highlighted: true }
                  ]
                }
              },
              {
                stepNum: 3,
                explanation: "free(arr) releases the Heap memory block to prevent dangling pointers & memory leaks.",
                codeLine: 10,
                memoryState: {
                  stack: [
                    { addr: "0x7ffe20", name: "arr", val: "NULL", type: "int*" }
                  ],
                  heap: []
                }
              }
            ],
            quiz: [
              {
                id: "q_dma_1",
                question: "Where is memory allocated when calling malloc() in C?",
                options: ["Stack Segment", "Heap Segment", "CPU Registers", "Code Segment"],
                answer: 1,
                explanation: "malloc() dynamically allocates memory at runtime from the Heap segment."
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "dsa-in-action",
    title: "Data Structures & Algorithms Visualized",
    category: "dsa",
    tagLabel: "Data Structures",
    tagClass: "dsa",
    description: "Step-by-step animations of Array operations, Bubble Sort, Quick Sort, and Linked Lists.",
    level: "Intermediate",
    lessonsCount: 3,
    duration: "50 mins",
    icon: "layers",
    modules: [
      {
        id: "dsa-mod-1",
        title: "Module 1: Sorting Algorithms & Linked Lists",
        lessons: [
          {
            id: "dsa-sort-1",
            title: "Bubble Sort Visual Execution Step-by-Step",
            duration: "15 mins",
            videoUrl: GDRIVE_FOLDER,
            summary: "Watch elements compare adjacent pairs and swap to sort an array in ascending order.",
            codeSnippet: `function bubbleSort(arr) {
    let n = arr.length;
    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                let temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
    return arr;
}`,
            language: "javascript",
            visualType: "dsa-bars",
            steps: [
              {
                stepNum: 1,
                explanation: "Initial unsorted array: [45, 12, 89, 34, 67]. Comparing arr[0] (45) and arr[1] (12).",
                codeLine: 4,
                dsaData: [
                  { val: 45, status: "comparing" },
                  { val: 12, status: "comparing" },
                  { val: 89, status: "normal" },
                  { val: 34, status: "normal" },
                  { val: 67, status: "normal" }
                ]
              },
              {
                stepNum: 2,
                explanation: "45 > 12: Swapping 45 and 12! Array becomes [12, 45, 89, 34, 67].",
                codeLine: 7,
                dsaData: [
                  { val: 12, status: "swapping" },
                  { val: 45, status: "swapping" },
                  { val: 89, status: "normal" },
                  { val: 34, status: "normal" },
                  { val: 67, status: "normal" }
                ]
              },
              {
                stepNum: 3,
                explanation: "After Pass 1, largest element 89 bubbles up to the end! [12, 34, 45, 67, 89].",
                codeLine: 12,
                dsaData: [
                  { val: 12, status: "sorted" },
                  { val: 34, status: "sorted" },
                  { val: 45, status: "sorted" },
                  { val: 67, status: "sorted" },
                  { val: 89, status: "sorted" }
                ]
              }
            ],
            quiz: [
              {
                id: "q_sort_1",
                question: "What is the worst-case time complexity of Bubble Sort?",
                options: ["O(N)", "O(N log N)", "O(N²)", "O(1)"],
                answer: 2,
                explanation: "Bubble Sort uses nested loops leading to O(N²) quadratic time complexity."
              }
            ]
          }
        ]
      }
    ]
  }
];

export const bubbleSortLesson = {
  id: "dsa-bubble-sort-visual",
  title: "Bubble Sort Algorithm (IntelliJ IDE Visual Debugger)",
  visualType: "dsa-bars",
  language: "c",
  codeSnippet: `#include <stdio.h>

void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}

int main() {
    int arr[] = {64, 34, 25, 12, 22};
    int n = 5;
    bubbleSort(arr, n);
    return 0;
}`,
  steps: [
    {
      codeLine: 18,
      explanation: "main() execution starts. Array arr[] = {64, 34, 25, 12, 22} allocated.",
      inlineHints: {
        16: "arr[]: {64, 34, 25, 12, 22}",
        17: "n: 5"
      },
      dsaData: [
        { val: 64 },
        { val: 34 },
        { val: 25 },
        { val: 12 },
        { val: 22 }
      ]
    },
    {
      codeLine: 3,
      explanation: "Calling bubbleSort(arr, n). Pass array pointer 0x5ffe50 and size n = 5.",
      inlineHints: {
        3: "arr: 0x5ffe50  n: 5"
      },
      dsaData: [
        { val: 64 },
        { val: 34 },
        { val: 25 },
        { val: 12 },
        { val: 22 }
      ]
    },
    {
      codeLine: 6,
      explanation: "Pass 1, j = 0: Compare arr[0] (64) and arr[1] (34). 64 > 34 → Swap required.",
      inlineHints: {
        3: "arr: 0x5ffe50  n: 5",
        4: "i: 0",
        5: "j: 0",
        7: "temp: 64"
      },
      dsaData: [
        { val: 64, status: "compare" },
        { val: 34, status: "compare" },
        { val: 25 },
        { val: 12 },
        { val: 22 }
      ]
    },
    {
      codeLine: 9,
      explanation: "Swap 64 and 34 → Array becomes [34, 64, 25, 12, 22]",
      inlineHints: {
        3: "arr: 0x5ffe50  n: 5",
        4: "i: 0",
        5: "j: 0",
        7: "temp: 64"
      },
      dsaData: [
        { val: 34, status: "swap" },
        { val: 64, status: "swap" },
        { val: 25 },
        { val: 12 },
        { val: 22 }
      ]
    },
    {
      codeLine: 6,
      explanation: "Pass 1, j = 1: Compare arr[1] (64) and arr[2] (25). 64 > 25 → Swap required.",
      inlineHints: {
        3: "arr: 0x5ffe50  n: 5",
        4: "i: 0",
        5: "j: 1",
        7: "temp: 64"
      },
      dsaData: [
        { val: 34 },
        { val: 64, status: "compare" },
        { val: 25, status: "compare" },
        { val: 12 },
        { val: 22 }
      ]
    },
    {
      codeLine: 9,
      explanation: "Swap 64 and 25 → Array becomes [34, 25, 64, 12, 22]",
      inlineHints: {
        3: "arr: 0x5ffe50  n: 5",
        4: "i: 0",
        5: "j: 1",
        7: "temp: 64"
      },
      dsaData: [
        { val: 34 },
        { val: 25, status: "swap" },
        { val: 64, status: "swap" },
        { val: 12 },
        { val: 22 }
      ]
    },
    {
      codeLine: 9,
      explanation: "Pass 1, j = 2: Executing arr[j + 1] = temp; (IntelliJ IDE active breakpoint step)",
      inlineHints: {
        3: "arr: 0x5ffe50  n: 5",
        4: "i: 0",
        5: "j: 2",
        7: "temp: 64"
      },
      dsaData: [
        { val: 34 },
        { val: 25 },
        { val: 12, status: "swap" },
        { val: 64, status: "swap" },
        { val: 22 }
      ]
    },
    {
      codeLine: 9,
      explanation: "Swap 64 and 22 → Result: [34, 25, 12, 22, 64]",
      inlineHints: {
        3: "arr: 0x5ffe50  n: 5",
        4: "i: 0",
        5: "j: 3",
        7: "temp: 64"
      },
      dsaData: [
        { val: 34 },
        { val: 25 },
        { val: 12 },
        { val: 22, status: "swap" },
        { val: 64, status: "swap" }
      ]
    },
    {
      codeLine: 4,
      explanation: "Pass 1 completed! Maximum element 64 bubbled to end index.",
      inlineHints: {
        3: "arr: 0x5ffe50  n: 5",
        4: "i: 0"
      },
      dsaData: [
        { val: 34 },
        { val: 25 },
        { val: 12 },
        { val: 22 },
        { val: 64, status: "sorted" }
      ]
    },
    {
      codeLine: 4,
      explanation: "Pass 2 completed! Element 34 placed in sorted position.",
      inlineHints: {
        3: "arr: 0x5ffe50  n: 5",
        4: "i: 1"
      },
      dsaData: [
        { val: 25 },
        { val: 12 },
        { val: 22 },
        { val: 34, status: "sorted" },
        { val: 64, status: "sorted" }
      ]
    },
    {
      codeLine: 4,
      explanation: "Pass 3 completed! Element 25 placed in sorted position.",
      inlineHints: {
        3: "arr: 0x5ffe50  n: 5",
        4: "i: 2"
      },
      dsaData: [
        { val: 12 },
        { val: 22 },
        { val: 25, status: "sorted" },
        { val: 34, status: "sorted" },
        { val: 64, status: "sorted" }
      ]
    },
    {
      codeLine: 12,
      explanation: "Bubble Sort Completed! Entire array sorted: [12, 22, 25, 34, 64]",
      inlineHints: {
        3: "arr: 0x5ffe50  n: 5",
        4: "i: 4"
      },
      dsaData: [
        { val: 12, status: "sorted" },
        { val: 22, status: "sorted" },
        { val: 25, status: "sorted" },
        { val: 34, status: "sorted" },
        { val: 64, status: "sorted" }
      ]
    }
  ]
};
