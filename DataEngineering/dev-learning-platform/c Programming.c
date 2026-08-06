#include <stdio.h>

int main() {
    int num1, num2, result;

    // Prompt the user to enter the numbers with a plus sign
    printf("Enter the expression (e.g., 5+5): ");
    
    // Read the pattern "integer + integer" from the user input
    if (scanf("%d+%d", &num1, &num2) == 2) {
        // Calculate the sum
        result = num1 + num2;
        
        // Display the final output
        printf("Output: %d + %d = %d\n", num1, num2, result);
    } else {
        printf("Invalid format! Please use the 'number+number' format.\n");
    }

    return 0;
}
